import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InventoryItem } from '../schemas/inventory-item.schema';
import { SupplierInvoice } from '../schemas/supplier-invoice.schema';
import { User } from '../schemas/user.schema';
import { StatisticsQueryDto } from '../dto/statistics.dto';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(InventoryItem.name) private inventoryModel: Model<InventoryItem>,
    @InjectModel(SupplierInvoice.name) private supplierInvoiceModel: Model<SupplierInvoice>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async getDashboardStats(query: StatisticsQueryDto) {
    const { period = 'monthly', startDate, endDate } = query;
    
    // Get all basic statistics
    const [
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalUsers,
      totalSupplierInvoices,
      pendingInvoices,
    ] = await Promise.all([
      this.inventoryModel.countDocuments(),
      this.inventoryModel.countDocuments({
        $expr: { $lte: ['$currentStock', '$minStock'] }
      }),
      this.inventoryModel.countDocuments({ currentStock: 0 }),
      this.userModel.countDocuments(),
      this.supplierInvoiceModel.countDocuments(),
      this.supplierInvoiceModel.countDocuments({ status: 'pending' }),
    ]);

    // Calculate total inventory value
    const inventoryValue = await this.inventoryModel.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: { $multiply: ['$currentStock', '$buyingPrice'] }
          }
        }
      }
    ]);

    // Get monthly expenses
    const monthlyExpenses = await this.supplierInvoiceModel.aggregate([
      {
        $match: {
          status: 'paid',
          invoiceDate: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get low stock items
    const lowStockItemsList = await this.inventoryModel
      .find({
        $expr: { $lte: ['$currentStock', '$minStock'] }
      })
      .select('name sku currentStock minStock maxStock category')
      .sort({ currentStock: 1 })
      .limit(10);

    // Get top expenses
    const topExpenses = await this.supplierInvoiceModel
      .find({ status: 'paid' })
      .populate('supplierId', 'name')
      .sort({ totalAmount: -1 })
      .limit(5)
      .select('invoiceRef supplierId totalAmount invoiceDate');

    // Get chart data
    let dateMatch: any = {};
    let groupBy: any = {};

    switch (period) {
      case 'daily':
        groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        dateMatch = { createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) } };
        break;
      case 'weekly':
        groupBy = { $week: '$createdAt' };
        dateMatch = { createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 90)) } };
        break;
      case 'yearly':
        groupBy = { $year: '$createdAt' };
        dateMatch = {};
        break;
      default: // monthly
        groupBy = { 
          $dateToString: { 
            format: '%Y-%m', 
            date: '$createdAt' 
          } 
        };
        dateMatch = { createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) } };
    }

    if (startDate && endDate) {
      dateMatch = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const [stockMovements, expenses, categoryDistribution] = await Promise.all([
      this.inventoryModel.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: groupBy,
            totalStock: { $sum: '$currentStock' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      this.supplierInvoiceModel.aggregate([
        { $match: { ...dateMatch, status: 'paid' } },
        {
          $group: {
            _id: groupBy,
            totalAmount: { $sum: '$totalAmount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      this.inventoryModel.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            value: { $sum: { $multiply: ['$currentStock', '$buyingPrice'] } }
          }
        }
      ])
    ]);

    // Get financial metrics
    const financialMetrics = await this.getFinancialMetrics(period, startDate, endDate);
    
    // Get product performance metrics
    const productMetrics = await this.getProductPerformanceMetrics();

    // Get trend analysis
    const trends = await this.getTrendAnalysis(period, startDate, endDate);

    return {
      overview: {
        inventory: {
          totalItems,
          lowStockItems,
          outOfStockItems,
          totalValue: inventoryValue[0]?.total || 0
        },
        users: {
          total: totalUsers
        },
        invoices: {
          total: totalSupplierInvoices,
          pending: pendingInvoices,
          monthlyExpenses: monthlyExpenses[0]?.total || 0
        },
        financials: {
          totalRevenue: financialMetrics.totalRevenue,
          totalExpenses: financialMetrics.totalExpenses,
          netProfit: financialMetrics.netProfit,
          profitMargin: financialMetrics.profitMargin
        }
      },
      alerts: {
        lowStockItems: lowStockItemsList,
        topExpenses,
        profitAlerts: financialMetrics.profitAlerts
      },
      charts: {
        stockMovements: stockMovements.map(item => ({
          period: item._id,
          totalStock: item.totalStock
        })),
        expenses: expenses.map(item => ({
          period: item._id,
          totalAmount: item.totalAmount
        })),
        categoryDistribution: categoryDistribution.map(item => ({
          category: item._id,
          itemCount: item.count,
          totalValue: item.value
        })),
        revenueVsExpenses: financialMetrics.revenueVsExpenses,
        profitTrend: financialMetrics.profitTrend,
        topProducts: productMetrics.topProducts,
        productPerformance: productMetrics.performance,
        trends: trends
      }
    };
  }

  private async getFinancialMetrics(period: string, startDate?: string, endDate?: string) {
    const dateMatch = this.getDateMatchCondition(period, startDate, endDate);

    const [revenueData, expenseData] = await Promise.all([
      this.supplierInvoiceModel.aggregate([
        { $match: { ...dateMatch, status: 'paid' } },
        {
          $group: {
            _id: this.getGroupByCondition(period),
            revenue: { $sum: '$totalAmount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      this.supplierInvoiceModel.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: this.getGroupByCondition(period),
            expenses: { $sum: '$totalAmount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
    const totalExpenses = expenseData.reduce((sum, item) => sum + item.expenses, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      revenueVsExpenses: this.combineRevenueExpenseData(revenueData, expenseData),
      profitTrend: this.calculateProfitTrend(revenueData, expenseData),
      profitAlerts: this.generateProfitAlerts(profitMargin, netProfit)
    };
  }

  private async getProductPerformanceMetrics() {
    const [topProducts, performance] = await Promise.all([
      this.inventoryModel.aggregate([
        {
          $project: {
            name: 1,
            sku: 1,
            totalValue: { $multiply: ['$currentStock', '$buyingPrice'] },
            profitMargin: {
              $multiply: [
                { $subtract: ['$sellingPrice', '$buyingPrice'] },
                '$currentStock'
              ]
            }
          }
        },
        { $sort: { profitMargin: -1 } },
        { $limit: 10 }
      ]),
      this.inventoryModel.aggregate([
        {
          $group: {
            _id: '$category',
            totalValue: { $sum: { $multiply: ['$currentStock', '$buyingPrice'] } },
            averageMargin: {
              $avg: {
                $multiply: [
                  { $subtract: ['$sellingPrice', '$buyingPrice'] },
                  100
                ]
              }
            }
          }
        }
      ])
    ]);

    return {
      topProducts,
      performance
    };
  }

  private async getTrendAnalysis(period: string, startDate?: string, endDate?: string) {
    const dateMatch = this.getDateMatchCondition(period, startDate, endDate);
    
    return this.supplierInvoiceModel.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: {
            period: this.getGroupByCondition(period),
            status: '$status'
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      {
        $group: {
          _id: '$_id.period',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count',
              amount: '$totalAmount'
            }
          }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
  }

  private getDateMatchCondition(period: string, startDate?: string, endDate?: string) {
    if (startDate && endDate) {
      return {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const now = new Date();
    switch (period) {
      case 'daily':
        return { createdAt: { $gte: new Date(now.setDate(now.getDate() - 30)) } };
      case 'weekly':
        return { createdAt: { $gte: new Date(now.setDate(now.getDate() - 90)) } };
      case 'yearly':
        return {};
      default: // monthly
        return { createdAt: { $gte: new Date(now.setMonth(now.getMonth() - 12)) } };
    }
  }

  private getGroupByCondition(period: string) {
    switch (period) {
      case 'daily':
        return { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      case 'weekly':
        return { $week: '$createdAt' };
      case 'yearly':
        return { $year: '$createdAt' };
      default: // monthly
        return { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    }
  }

  private combineRevenueExpenseData(revenueData: any[], expenseData: any[]) {
    const periods = new Set([
      ...revenueData.map(item => item._id),
      ...expenseData.map(item => item._id)
    ]);

    return Array.from(periods).map(period => ({
      period,
      revenue: revenueData.find(item => item._id === period)?.revenue || 0,
      expenses: expenseData.find(item => item._id === period)?.expenses || 0
    }));
  }

  private calculateProfitTrend(revenueData: any[], expenseData: any[]) {
    const combined = this.combineRevenueExpenseData(revenueData, expenseData);
    return combined.map(item => ({
      period: item.period,
      profit: item.revenue - item.expenses,
      margin: item.revenue ? ((item.revenue - item.expenses) / item.revenue) * 100 : 0
    }));
  }

  private generateProfitAlerts(profitMargin: number, netProfit: number) {
    const alerts = [];
    if (profitMargin < 10) {
      alerts.push({
        type: 'warning',
        message: 'Low profit margin detected',
        value: profitMargin
      });
    }
    if (netProfit < 0) {
      alerts.push({
        type: 'critical',
        message: 'Negative profit detected',
        value: netProfit
      });
    }
    return alerts;
  }
} 