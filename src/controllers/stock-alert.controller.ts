import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StockAlertService } from '../services/stock-alert.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Stock Alerts')
@ApiBearerAuth()
@Controller('stock-alerts')
@UseGuards(JwtAuthGuard)
export class StockAlertController {
  constructor(private readonly stockAlertService: StockAlertService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get stock alerts',
    description: 'Retrieve stock alerts based on filters. Can filter by item, alert type, and date range.'
  })
  @ApiQuery({ name: 'itemId', required: false, description: 'Filter alerts by specific item ID' })
  @ApiQuery({ 
    name: 'type', 
    required: false, 
    enum: ['LOW_STOCK', 'EXCESS_STOCK', 'EXPIRING'],
    description: 'Filter alerts by type'
  })
  @ApiQuery({ 
    name: 'startDate', 
    required: false, 
    type: Date,
    description: 'Filter alerts from this date (inclusive)'
  })
  @ApiQuery({ 
    name: 'endDate', 
    required: false, 
    type: Date,
    description: 'Filter alerts until this date (inclusive)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns list of stock alerts',
    schema: {
      type: 'array',
      items: {
        properties: {
          id: { type: 'string' },
          itemId: { type: 'string' },
          type: { 
            type: 'string',
            enum: ['LOW_STOCK', 'EXCESS_STOCK', 'EXPIRING']
          },
          message: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  async getStockAlerts(
    @Query('itemId') itemId?: string,
    @Query('type') type?: 'LOW_STOCK' | 'EXCESS_STOCK' | 'EXPIRING',
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    return this.stockAlertService.getStockAlerts({
      itemId,
      type,
      startDate,
      endDate,
    });
  }

  @Get('report')
  @ApiOperation({ 
    summary: 'Get stock report',
    description: 'Generate a comprehensive report of stock status including alerts analytics and trends'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns stock report with analytics',
    schema: {
      properties: {
        totalAlerts: { type: 'number' },
        alertsByType: {
          type: 'object',
          properties: {
            LOW_STOCK: { type: 'number' },
            EXCESS_STOCK: { type: 'number' },
            EXPIRING: { type: 'number' }
          }
        },
        trends: {
          type: 'array',
          items: {
            properties: {
              date: { type: 'string', format: 'date' },
              count: { type: 'number' }
            }
          }
        }
      }
    }
  })
  async getStockReport() {
    return this.stockAlertService.generateStockReport();
  }
} 