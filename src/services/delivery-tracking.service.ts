import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Delivery, DeliveryDocument } from '../schemas/delivery.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { MailerService } from './mailer.service';
import { GeocodingService } from './geocoding.service';

@Injectable()
export class DeliveryTrackingService {
  private readonly logger = new Logger(DeliveryTrackingService.name);

  constructor(
    @InjectModel(Delivery.name) private deliveryModel: Model<DeliveryDocument>,
    private eventEmitter: EventEmitter2,
    private mailerService: MailerService,
    private geocodingService: GeocodingService,
  ) {}

  async updateLocation(
    deliveryId: string,
    location: { coordinates: [number, number]; address: string },
  ): Promise<DeliveryDocument> {
    try {
      const delivery = await this.deliveryModel.findById(deliveryId);
      if (!delivery) {
        throw new NotFoundException(`Delivery #${deliveryId} not found`);
      }

      if (!delivery.tracking) {
        delivery.tracking = {
          history: [],
        };
      }

      // Update current location
      delivery.tracking.currentLocation = location;

      // Add location update to history
      delivery.tracking.history.push({
        timestamp: new Date(),
        status: delivery.status,
        location,
      });

      // Check if near destination and update status if needed
      if (delivery.status === DeliveryStatus.IN_TRANSIT) {
        const destinationCoords = await this.geocodingService.getCoordinatesFromLocation(delivery.deliveryLocation);
        if (this.isNearDestination(location.coordinates, destinationCoords)) {
          delivery.status = DeliveryStatus.ARRIVING;
        }
      }

      return delivery.save();
    } catch (error) {
      this.logger.error(`Error updating delivery location: ${error.message}`);
      throw error;
    }
  }

  async updateDeliveryStatus(deliveryId: string, status: DeliveryStatus, notes?: string) {
    try {
      const delivery = await this.deliveryModel.findById(deliveryId);

      if (!delivery) {
        throw new Error('Delivery not found');
      }

      const historyEntry = {
        status,
        location: delivery.tracking?.currentLocation,
        timestamp: new Date(),
        notes,
      };

      const updatedDelivery = await this.deliveryModel.findByIdAndUpdate(
        deliveryId,
        {
          $set: { status },
          $push: { 'tracking.history': historyEntry },
        },
        { new: true },
      );

      // Send notification based on status
      await this.sendStatusNotification(updatedDelivery);

      // Emit status update event
      this.eventEmitter.emit('delivery.status.updated', {
        deliveryId,
        status,
        timestamp: new Date(),
      });

      return updatedDelivery;
    } catch (error) {
      this.logger.error(`Error updating delivery status: ${error.message}`);
      throw error;
    }
  }

  async recordProofOfDelivery(
    deliveryId: string,
    proof: {
      signature?: string;
      photos?: string[];
      notes?: string;
      receivedBy: string;
    },
  ) {
    try {
      const delivery = await this.deliveryModel.findById(deliveryId);
      if (!delivery) {
        throw new Error('Delivery not found');
      }

      const proofOfDelivery = {
        ...proof,
        timestamp: new Date(),
      };

      const updatedDelivery = await this.deliveryModel.findByIdAndUpdate(
        deliveryId,
        {
          $set: {
            proofOfDelivery,
            status: DeliveryStatus.DELIVERED,
            'tracking.actualDeliveryDate': new Date()
          },
        },
        { new: true },
      );

      // Send delivery completion notification
      await this.sendDeliveryCompletionNotification(updatedDelivery);

      return updatedDelivery;
    } catch (error) {
      this.logger.error(`Error recording proof of delivery: ${error.message}`);
      throw error;
    }
  }

  private async sendStatusNotification(delivery: DeliveryDocument) {
    try {
      const statusMessages = {
        [DeliveryStatus.ASSIGNED]: 'Your delivery has been assigned to a driver.',
        [DeliveryStatus.PICKED_UP]: 'Your delivery has been picked up and is on its way!',
        [DeliveryStatus.IN_TRANSIT]: 'Your delivery is in transit.',
        [DeliveryStatus.ARRIVING]: 'Your delivery will arrive soon!',
        [DeliveryStatus.OUT_FOR_DELIVERY]: 'Your delivery is out for delivery!',
        [DeliveryStatus.DELIVERED]: 'Your delivery has been completed.',
        [DeliveryStatus.COMPLETED]: 'Your delivery has been completed and verified.',
        [DeliveryStatus.CANCELLED]: 'Your delivery has been cancelled.',
        [DeliveryStatus.FAILED]: 'Your delivery has failed.',
        [DeliveryStatus.RETURNED]: 'Your delivery is being returned.',
        [DeliveryStatus.VOIDED]: 'Your delivery has been voided.',
      };

      const message = statusMessages[delivery.status];
      if (!message) return;

      await this.mailerService.sendMail({
        to: delivery.customerEmail,
        subject: `Delivery Update - ${delivery.status}`,
        template: 'delivery-status-update',
        context: {
          customerName: delivery.customerName,
          status: delivery.status,
          message,
          trackingLink: `${process.env.FRONTEND_URL}/deliveries/${delivery._id}`,
        },
      });
    } catch (error) {
      this.logger.error(`Error sending status notification: ${error.message}`);
    }
  }

  private async sendDeliveryCompletionNotification(delivery: DeliveryDocument) {
    try {
      await this.mailerService.sendMail({
        to: delivery.customerEmail,
        subject: 'Delivery Completed',
        template: 'delivery-completed',
        context: {
          customerName: delivery.customerName,
          deliveryId: delivery._id,
          completionTime: new Date().toLocaleString(),
          receivedBy: delivery.proofOfDelivery?.receivedBy || 'Not specified',
        },
      });
    } catch (error) {
      this.logger.error(`Error sending completion notification: ${error.message}`);
    }
  }

  private isNearDestination(
    currentCoordinates: [number, number],
    destinationCoordinates: [number, number],
  ): boolean {
    const [currentLat, currentLng] = currentCoordinates;
    const [destLat, destLng] = destinationCoordinates;
    const distance = this.calculateDistance(
      currentLat,
      currentLng,
      destLat,
      destLng,
    );
    return distance <= 0.1; // Within 100 meters
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}