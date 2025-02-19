import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Delivery, DeliveryDocument } from '../schemas/delivery.schema';
import * as DeliveryDtos from '../dto/delivery.dto';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { DeliveryCompany, DeliveryCompanyDocument } from '../schemas/delivery-company.schema';

interface GetDeliveriesResponse {
  deliveries: DeliveryDocument[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable()
export class DeliveryService {
  constructor(
    @InjectModel(Delivery.name) private deliveryModel: Model<DeliveryDocument>,
    @InjectModel(DeliveryCompany.name) private deliveryCompanyModel: Model<DeliveryCompanyDocument>,
  ) {}

  private generateInvoiceNumber(): string {
    const prefix = 'INV';
    const timestamp = new Date();
    const year = timestamp.getFullYear().toString().slice(-2);
    const month = (timestamp.getMonth() + 1).toString().padStart(2, '0');
    const day = timestamp.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${year}${month}${day}-${random}`;
  }

  async create(createDeliveryDto: DeliveryDtos.CreateDeliveryDto): Promise<DeliveryDocument> {
    // Check if delivery company exists
    const deliveryCompany = await this.deliveryCompanyModel.findById(createDeliveryDto.deliveryCompanyId);
    if (!deliveryCompany) {
      throw new NotFoundException('Delivery company not found');
    }

    const delivery = new this.deliveryModel({
      ...createDeliveryDto,
      status: DeliveryStatus.PENDING,
      tracking: {
        history: [{
          timestamp: new Date(),
          status: DeliveryStatus.PENDING,
          notes: 'Delivery created'
        }]
      },
      invoiceNumber: this.generateInvoiceNumber()
    });

    return delivery.save();
  }

  async findAll(query: DeliveryDtos.DeliveryQueryDto): Promise<GetDeliveriesResponse> {
    const { search, status, startDate, endDate, page = 1, limit = 10 } = query;
    const filter: any = {};

    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== DeliveryStatus.ALL) {
      filter.status = status;
    }

    if (startDate) {
      filter.createdAt = { $gte: new Date(startDate) };
    }

    if (endDate) {
      filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };
    }

    const [deliveries, total] = await Promise.all([
      this.deliveryModel
        .find(filter)
        .populate({
          path: 'deliveryCompanyId',
          select: 'name code phone address status rating'
        })
        .populate({
          path: 'items.productId',
          select: 'name sku description unitPrice category currentStock image'
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.deliveryModel.countDocuments(filter),
    ]);

    return {
      deliveries,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<DeliveryDocument> {
    const delivery = await this.deliveryModel.findById(id)
      .populate({
        path: 'deliveryCompanyId',
        select: 'name code phone address status rating'
      })
      .populate({
        path: 'items.productId',
        select: 'name sku description unitPrice category currentStock image'
      })
      .exec();

    if (!delivery) {
      throw new NotFoundException(`Delivery #${id} not found`);
    }

    return delivery;
  }

  async update(id: string, updateDeliveryDto: DeliveryDtos.UpdateDeliveryDto): Promise<DeliveryDocument> {
    const delivery = await this.findById(id);

    // Validate status transition
    if (updateDeliveryDto.status && updateDeliveryDto.status !== delivery.status) {
      if (delivery.status === DeliveryStatus.CANCELLED || delivery.status === DeliveryStatus.VOIDED) {
        throw new BadRequestException(`Cannot update cancelled or voided delivery #${id}`);
      }
      if (delivery.status === DeliveryStatus.COMPLETED && 
          updateDeliveryDto.status !== DeliveryStatus.RETURNED) {
        throw new BadRequestException(`Completed delivery #${id} can only be returned`);
      }
    }

    const updatedDelivery = await this.deliveryModel
      .findByIdAndUpdate(id, updateDeliveryDto, { new: true, runValidators: true })
      .populate('deliveryCompanyId', 'name code phone')
      .exec();

    if (!updatedDelivery) {
      throw new NotFoundException(`Delivery #${id} not found`);
    }

    return updatedDelivery;
  }

  async updateStatus(
    id: string,
    status: DeliveryStatus,
    notes?: string,
    location?: { coordinates: [number, number]; address: string },
  ): Promise<DeliveryDocument> {
    const delivery = await this.findById(id);

    // Validate status transition
    if (delivery.status === DeliveryStatus.CANCELLED || delivery.status === DeliveryStatus.VOIDED) {
      throw new BadRequestException(`Cannot update cancelled or voided delivery #${id}`);
    }
    if (delivery.status === DeliveryStatus.COMPLETED && status !== DeliveryStatus.RETURNED) {
      throw new BadRequestException(`Completed delivery #${id} can only be returned`);
    }

    const historyEntry = {
      timestamp: new Date(),
      status,
      location,
      notes,
    };

    const updateData: any = {
      status,
      $push: { 'tracking.history': historyEntry },
    };

    if (location) {
      updateData['tracking.currentLocation'] = location;
    }

    if (status === DeliveryStatus.DELIVERED) {
      updateData['tracking.actualDeliveryDate'] = new Date();
    }

    return this.deliveryModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('deliveryCompanyId', 'name code phone')
      .exec();
  }

  async delete(id: string): Promise<void> {
    const result = await this.deliveryModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Delivery #${id} not found`);
    }
  }

  async createBulk(deliveries: DeliveryDtos.CreateDeliveryDto[]): Promise<DeliveryDocument[]> {
    const session = await this.deliveryModel.db.startSession();
    session.startTransaction();

    try {
      const processedDeliveries = deliveries.map(dto => ({
        ...dto,
        status: DeliveryStatus.PENDING,
        tracking: {
          history: [{
            timestamp: new Date(),
            status: DeliveryStatus.PENDING,
            notes: 'Delivery created'
          }]
        },
        invoiceNumber: this.generateInvoiceNumber()
      }));

      const createdDeliveries = await this.deliveryModel.create(processedDeliveries, { session }) as DeliveryDocument[];
      await session.commitTransaction();
      
      const populatedDeliveries = await this.deliveryModel
        .find({ _id: { $in: createdDeliveries.map(d => d._id) } })
        .populate('deliveryCompanyId', 'name code phone')
        .exec();

      return populatedDeliveries;
    } catch (error) {
      await session.abortTransaction();
      if (error.code === 11000) {
        throw new ConflictException('Duplicate invoice number detected. Please try again.');
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updateBulk(updates: { id: string; data: DeliveryDtos.UpdateDeliveryDto }[]): Promise<DeliveryDocument[]> {
    const session = await this.deliveryModel.db.startSession();
    session.startTransaction();

    try {
      const updatedDeliveries = await Promise.all(
        updates.map(async ({ id, data }) => {
          const delivery = await this.deliveryModel.findById(id);
          if (!delivery) {
            throw new NotFoundException(`Delivery #${id} not found`);
          }

          // Validate status transition
          if (data.status && data.status !== delivery.status) {
            if (delivery.status === DeliveryStatus.CANCELLED || delivery.status === DeliveryStatus.VOIDED) {
              throw new BadRequestException(`Cannot update cancelled or voided delivery #${id}`);
            }
            if (delivery.status === DeliveryStatus.COMPLETED && 
                data.status !== DeliveryStatus.RETURNED) {
              throw new BadRequestException(`Completed delivery #${id} can only be returned`);
            }
          }

          return this.deliveryModel.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true, session }
          );
        })
      );

      await session.commitTransaction();

      return this.deliveryModel
        .find({ _id: { $in: updatedDeliveries.map(d => d._id) } })
        .populate('deliveryCompanyId', 'name code phone')
        .exec();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async voidDelivery(id: string): Promise<DeliveryDocument> {
    const delivery = await this.findById(id);

    if (delivery.status === DeliveryStatus.VOIDED) {
      throw new BadRequestException('Delivery is already voided');
    }

    if (delivery.status === DeliveryStatus.COMPLETED) {
      throw new BadRequestException('Cannot void a completed delivery');
    }

    const updatedDelivery = await this.deliveryModel.findByIdAndUpdate(
      id,
      { 
        $set: { 
          status: DeliveryStatus.VOIDED,
          'tracking.history': [
            ...delivery.tracking.history,
            {
              timestamp: new Date(),
              status: DeliveryStatus.VOIDED,
              notes: 'Delivery voided'
            }
          ]
        }
      },
      { new: true, runValidators: true }
    )
    .populate('deliveryCompanyId', 'name code phone')
    .exec();

    if (!updatedDelivery) {
      throw new NotFoundException(`Delivery #${id} not found`);
    }

    return updatedDelivery;
  }

  async addProofOfDelivery(
    id: string,
    proofOfDelivery: {
      receivedBy: string;
      signature?: string;
      photos?: string[];
      notes?: string;
    }
  ): Promise<DeliveryDocument> {
    const delivery = await this.findById(id);

    if (delivery.status !== DeliveryStatus.DELIVERED) {
      throw new BadRequestException('Proof of delivery can only be added to delivered items');
    }

    const updatedDelivery = await this.deliveryModel.findByIdAndUpdate(
      id,
      { $set: { proofOfDelivery } },
      { new: true, runValidators: true }
    )
    .populate('deliveryCompanyId', 'name code phone')
    .exec();

    if (!updatedDelivery) {
      throw new NotFoundException(`Delivery #${id} not found`);
    }

    return updatedDelivery;
  }
} 