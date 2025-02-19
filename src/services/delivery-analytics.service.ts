import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Delivery, DeliveryDocument } from '../schemas/delivery.schema';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface PerformanceMetrics {
  totalDeliveries: number;
  completedDeliveries: number;
  failedDeliveries: number;
  onTimeDeliveries: number;
  averageDeliveryTime: number;
  completionRate: number;
  onTimeRate: number;
}

interface DeliveryTrends {
  daily: {
    date: string;
    deliveries: number;
    onTime: number;
    failed: number;
  }[];
  hourly: {
    hour: number;
    deliveries: number;
  }[];
}

@Injectable()
export class DeliveryAnalyticsService {
  private readonly logger = new Logger(DeliveryAnalyticsService.name);

  constructor(
    @InjectModel(Delivery.name) private deliveryModel: Model<DeliveryDocument>
  ) {}

  async getPerformanceMetrics(startDate: Date, endDate: Date): Promise<PerformanceMetrics> {
    try {
      const deliveries = await this.deliveryModel.find({
        'tracking.history': {
          $elemMatch: {
            timestamp: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
      });

      const metrics: PerformanceMetrics = {
        totalDeliveries: deliveries.length,
        completedDeliveries: 0,
        failedDeliveries: 0,
        onTimeDeliveries: 0,
        averageDeliveryTime: 0,
        completionRate: 0,
        onTimeRate: 0,
      };

      let totalDeliveryTime = 0;
      let deliveriesWithTime = 0;

      for (const delivery of deliveries) {
        if (delivery.status === DeliveryStatus.DELIVERED) {
          metrics.completedDeliveries++;
          if (await this.calculateDeliveryPerformance(delivery)) {
            metrics.onTimeDeliveries++;
          }

          const deliveryTime = this.calculateDeliveryTime(delivery);
          if (deliveryTime !== null) {
            totalDeliveryTime += deliveryTime;
            deliveriesWithTime++;
          }
        } else if (delivery.status === DeliveryStatus.FAILED) {
          metrics.failedDeliveries++;
        }
      }

      metrics.completionRate = metrics.completedDeliveries / metrics.totalDeliveries;
      metrics.onTimeRate = metrics.onTimeDeliveries / metrics.completedDeliveries;
      metrics.averageDeliveryTime = deliveriesWithTime > 0 ? totalDeliveryTime / deliveriesWithTime : 0;

      return metrics;
    } catch (error) {
      this.logger.error(`Error getting performance metrics: ${error.message}`);
      throw error;
    }
  }

  private calculateDeliveryTime(delivery: DeliveryDocument): number | null {
    if (!delivery.tracking?.actualDeliveryDate || !delivery.tracking.history?.[0]?.timestamp) {
      return null;
    }

    const startTime = delivery.tracking.history[0].timestamp;
    const endTime = delivery.tracking.actualDeliveryDate;
    return (endTime.getTime() - startTime.getTime()) / (1000 * 60); // Return time in minutes
  }

  async calculateDeliveryPerformance(delivery: DeliveryDocument): Promise<boolean> {
    try {
      if (!delivery.tracking || !delivery.tracking.actualDeliveryDate) {
        return false;
      }

      const actualDelivery = delivery.tracking.actualDeliveryDate;
      const startTime = delivery.tracking.history?.[0]?.timestamp;
      if (!startTime) {
        return false;
      }

      // Consider delivery on time if completed within 24 hours
      const deadline = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
      return actualDelivery <= deadline;
    } catch (error) {
      this.logger.error(`Error calculating delivery performance: ${error.message}`);
      return false;
    }
  }

  async getDeliveryTrends(
    startDate: Date,
    endDate: Date,
    driverId?: string,
  ): Promise<DeliveryTrends> {
    try {
      const query: any = {
        'tracking.history': {
          $elemMatch: {
            timestamp: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
      };

      if (driverId) {
        query.driverId = driverId;
      }

      const deliveries = await this.deliveryModel.find(query);

      // Daily trends
      const dailyTrends = deliveries.reduce((acc, delivery) => {
        const firstEntry = delivery.tracking?.history?.[0];
        if (!firstEntry?.timestamp) return acc;

        const date = firstEntry.timestamp.toISOString().split('T')[0];
        const entry = acc.find(d => d.date === date) || {
          date,
          deliveries: 0,
          onTime: 0,
          failed: 0,
        };

        if (!acc.find(d => d.date === date)) {
          acc.push(entry);
        }

        entry.deliveries++;

        if (delivery.status === DeliveryStatus.DELIVERED) {
          const deliveryTime = delivery.tracking.actualDeliveryDate;
          const startTime = delivery.tracking.history[0].timestamp;
          // Consider delivery on time if completed within 24 hours
          const deadline = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
          if (deliveryTime && deliveryTime <= deadline) {
            entry.onTime++;
          }
        } else if (delivery.status === DeliveryStatus.FAILED) {
          entry.failed++;
        }

        return acc;
      }, []);

      // Hourly trends
      const hourlyTrends = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        deliveries: deliveries.filter(
          d => d.tracking?.actualDeliveryDate && new Date(d.tracking.actualDeliveryDate).getHours() === hour,
        ).length,
      }));

      return {
        daily: dailyTrends,
        hourly: hourlyTrends,
      };
    } catch (error) {
      this.logger.error(`Error getting delivery trends: ${error.message}`);
      throw error;
    }
  }

  async getDriverPerformanceRanking(
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    try {
      const drivers = await this.deliveryModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            driverId: { $exists: true },
          },
        },
        {
          $group: {
            _id: '$driverId',
            totalDeliveries: { $sum: 1 },
            completedDeliveries: {
              $sum: {
                $cond: [{ $eq: ['$status', DeliveryStatus.DELIVERED] }, 1, 0],
              },
            },
            failedDeliveries: {
              $sum: {
                $cond: [{ $eq: ['$status', DeliveryStatus.FAILED] }, 1, 0],
              },
            },
            totalDeliveryTime: {
              $sum: {
                $cond: [
                  { $eq: ['$status', DeliveryStatus.DELIVERED] },
                  {
                    $divide: [
                      {
                        $subtract: [
                          '$tracking.actualDeliveryDate',
                          { $arrayElemAt: ['$tracking.history.timestamp', 0] },
                        ],
                      },
                      60000, // Convert to minutes
                    ],
                  },
                  0,
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'driver',
          },
        },
        {
          $unwind: '$driver',
        },
        {
          $project: {
            driverId: '$_id',
            driverName: '$driver.name',
            totalDeliveries: 1,
            completedDeliveries: 1,
            failedDeliveries: 1,
            completionRate: {
              $multiply: [
                { $divide: ['$completedDeliveries', '$totalDeliveries'] },
                100,
              ],
            },
            averageDeliveryTime: {
              $divide: ['$totalDeliveryTime', '$completedDeliveries'],
            },
          },
        },
        {
          $sort: { completionRate: -1, averageDeliveryTime: 1 },
        },
      ]);

      return drivers;
    } catch (error) {
      this.logger.error(`Error getting driver performance ranking: ${error.message}`);
      throw error;
    }
  }

  async getDailyDeliveryStats(): Promise<{ [key: string]: number }> {
    try {
      const today = new Date();
      const deliveries = await this.deliveryModel.find({
        'tracking.history': {
          $elemMatch: {
            timestamp: {
              $gte: startOfDay(today),
              $lte: endOfDay(today),
            },
          },
        },
      });

      const stats: { [key: string]: number } = {};

      for (const delivery of deliveries) {
        const firstEntry = delivery.tracking?.history?.[0];
        if (firstEntry?.timestamp) {
          const entryDate = firstEntry.timestamp.toISOString().split('T')[0];
          stats[entryDate] = (stats[entryDate] || 0) + 1;
        }
      }

      return stats;
    } catch (error) {
      this.logger.error(`Error getting daily delivery stats: ${error.message}`);
      throw error;
    }
  }

  async getDeliveryHotspots(): Promise<any[]> {
    try {
      return this.deliveryModel.aggregate([
        {
          $match: {
            'deliveryAddress.coordinates': { $exists: true },
            status: DeliveryStatus.DELIVERED,
          },
        },
        {
          $group: {
            _id: {
              coordinates: '$deliveryAddress.coordinates',
            },
            deliveryCount: { $sum: 1 },
            averageDeliveryTime: {
              $avg: {
                $divide: [
                  {
                    $subtract: [
                      '$tracking.actualDeliveryDate',
                      { $arrayElemAt: ['$tracking.history.timestamp', 0] },
                    ],
                  },
                  60000,
                ],
              },
            },
          },
        },
        {
          $project: {
            location: '$_id',
            deliveryCount: 1,
            averageDeliveryTime: 1,
            intensity: {
              $divide: ['$deliveryCount', { $add: ['$averageDeliveryTime', 1] }],
            },
          },
        },
        {
          $sort: { deliveryCount: -1 },
        },
      ]);
    } catch (error) {
      this.logger.error(`Error getting delivery hotspots: ${error.message}`);
      throw error;
    }
  }
} 