import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Delivery, DeliveryDocument } from '../schemas/delivery.schema';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { startOfDay, endOfDay } from 'date-fns';
import { GeocodingService } from './geocoding.service';

interface Point {
  latitude: number;
  longitude: number;
}

interface DeliveryPoint {
  delivery: DeliveryDocument;
  coordinates: [number, number];
}

interface OptimizedRoute {
  deliveryId: string;
  order: number;
  distance: number;
  estimatedDuration: number;
  points: Point[];
}

@Injectable()
export class RouteOptimizationService {
  private readonly logger = new Logger(RouteOptimizationService.name);

  constructor(
    @InjectModel(Delivery.name) private deliveryModel: Model<DeliveryDocument>,
    private geocodingService: GeocodingService,
  ) {}

  private isNearDestination(
    currentLocation: { latitude: number; longitude: number },
    destinationCoordinates: [number, number],
  ): boolean {
    const [destLat, destLng] = destinationCoordinates;
    const distance = this.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
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

  private sortByProximity(deliveryPoints: DeliveryPoint[]): DeliveryPoint[] {
    if (deliveryPoints.length <= 1) {
      return deliveryPoints;
    }

    const sorted: DeliveryPoint[] = [deliveryPoints[0]];
    const remaining = deliveryPoints.slice(1);

    while (remaining.length > 0) {
      const lastPoint = sorted[sorted.length - 1];
      let nearestIndex = 0;
      let shortestDistance = Number.MAX_VALUE;

      for (let i = 0; i < remaining.length; i++) {
        const distance = this.calculateDistance(
          lastPoint.coordinates[0],
          lastPoint.coordinates[1],
          remaining[i].coordinates[0],
          remaining[i].coordinates[1]
        );

        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestIndex = i;
        }
      }

      sorted.push(remaining[nearestIndex]);
      remaining.splice(nearestIndex, 1);
    }

    return sorted;
  }

  async optimizeRoute(deliveryIds: string[]): Promise<DeliveryDocument[]> {
    const deliveries = await this.deliveryModel.find({ _id: { $in: deliveryIds } }).exec();
    
    // Convert delivery addresses to coordinates
    const deliveryPoints = await Promise.all(
      deliveries.map(async (delivery) => {
        const coordinates = await this.geocodingService.getCoordinatesFromLocation(delivery.deliveryLocation);
        return {
          delivery,
          coordinates,
        };
      })
    );

    // Sort deliveries by proximity
    const sortedDeliveries = this.sortByProximity(deliveryPoints);
    return sortedDeliveries.map(point => point.delivery);
  }

  async optimizeRoutes(driverId: string, date: Date): Promise<any[]> {
    try {
      const deliveries = await this.deliveryModel.find({
        driverId,
        status: { $in: [DeliveryStatus.ASSIGNED, DeliveryStatus.IN_TRANSIT, DeliveryStatus.OUT_FOR_DELIVERY] },
        'tracking.history': {
          $elemMatch: {
            timestamp: {
              $gte: startOfDay(date),
              $lte: endOfDay(date),
            },
          },
        },
      });

      if (!deliveries.length) {
        return [];
      }

      const routes = [];
      let currentRoute = [];
      
      // Get coordinates for first delivery
      const firstDeliveryCoords = await this.geocodingService.getCoordinatesFromLocation(deliveries[0].deliveryLocation);
      let currentLocation = firstDeliveryCoords;

      for (const delivery of deliveries) {
        const nextLocation = await this.geocodingService.getCoordinatesFromLocation(delivery.deliveryLocation);
        const distance = this.calculateDistance(
          currentLocation[0],
          currentLocation[1],
          nextLocation[0],
          nextLocation[1],
        );

        if (distance > 10) { // Start new route if distance > 10km
          if (currentRoute.length) {
            routes.push([...currentRoute]);
          }
          currentRoute = [];
        }

        currentRoute.push({
          id: delivery._id,
          coordinates: nextLocation,
          status: delivery.status,
        });

        currentLocation = nextLocation;
      }

      if (currentRoute.length) {
        routes.push(currentRoute);
      }

      return routes;
    } catch (error) {
      this.logger.error(`Error optimizing routes: ${error.message}`);
      throw error;
    }
  }

  private isWithinTimeWindow(timeWindow: { start: Date; end: Date }): boolean {
    const now = new Date();
    return now >= timeWindow.start && now <= timeWindow.end;
  }

  async updateDeliveryRoute(
    deliveryId: string,
    optimizedRoute: OptimizedRoute,
  ): Promise<void> {
    try {
      await this.deliveryModel.findByIdAndUpdate(deliveryId, {
        $set: {
          'tracking.route': {
            points: optimizedRoute.points,
            optimized: true,
          },
          'tracking.estimatedDeliveryDate': new Date(
            Date.now() + optimizedRoute.estimatedDuration * 60000,
          ),
        },
      });
    } catch (error) {
      this.logger.error(`Error updating delivery route: ${error.message}`);
      throw error;
    }
  }
} 