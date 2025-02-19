import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StockMovement, StockMovementDocument } from '../schemas/stock-movement.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class StockAlertService {
  private readonly logger = new Logger(StockAlertService.name);

  constructor(
    @InjectModel(StockMovement.name)
    private stockMovementModel: Model<StockMovementDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkStockLevels() {
    try {
      const lowStockItems = await this.stockMovementModel.aggregate([
        {
          $group: {
            _id: '$itemId',
            currentStock: { $sum: '$quantity' },
            minimumThreshold: { $first: '$minimumThreshold' },
            maximumThreshold: { $first: '$maximumThreshold' },
          },
        },
        {
          $match: {
            $or: [
              { $expr: { $lt: ['$currentStock', '$minimumThreshold'] } },
              { $expr: { $gt: ['$currentStock', '$maximumThreshold'] } },
            ],
          },
        },
      ]);

      for (const item of lowStockItems) {
        this.eventEmitter.emit('stock.alert', {
          itemId: item._id,
          currentStock: item.currentStock,
          minimumThreshold: item.minimumThreshold,
          maximumThreshold: item.maximumThreshold,
          type: item.currentStock < item.minimumThreshold ? 'LOW_STOCK' : 'EXCESS_STOCK',
          timestamp: new Date(),
        });
      }
    } catch (error) {
      this.logger.error('Error checking stock levels:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiryDates() {
    try {
      const expiringItems = await this.stockMovementModel.find({
        expiryDate: {
          $exists: true,
          $ne: null,
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      });

      for (const item of expiringItems) {
        this.eventEmitter.emit('stock.expiry', {
          itemId: item.itemId,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          quantity: item.quantity,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      this.logger.error('Error checking expiry dates:', error);
    }
  }

  async getStockAlerts(filters: {
    itemId?: string;
    type?: 'LOW_STOCK' | 'EXCESS_STOCK' | 'EXPIRING';
    startDate?: Date;
    endDate?: Date;
  }) {
    const query: any = {};

    if (filters.itemId) {
      query.itemId = filters.itemId;
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    return this.stockMovementModel
      .find(query)
      .populate('itemId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async generateStockReport() {
    try {
      const report = await this.stockMovementModel.aggregate([
        {
          $group: {
            _id: '$itemId',
            totalQuantity: { $sum: '$quantity' },
            movements: { $push: '$$ROOT' },
            averageUnitCost: { $avg: '$unitCost' },
            totalValue: {
              $sum: { $multiply: ['$quantity', { $ifNull: ['$unitCost', 0] }] },
            },
          },
        },
        {
          $lookup: {
            from: 'inventoryitems',
            localField: '_id',
            foreignField: '_id',
            as: 'itemDetails',
          },
        },
        {
          $unwind: '$itemDetails',
        },
      ]);

      return report;
    } catch (error) {
      this.logger.error('Error generating stock report:', error);
      throw error;
    }
  }
} 