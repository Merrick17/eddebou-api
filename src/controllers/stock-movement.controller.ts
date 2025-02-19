import { Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards, ValidationPipe, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StockMovementService } from '../services/stock-movement.service';
import { CreateStockMovementDto, UpdateStockMovementDto, BulkCreateStockMovementDto, StockMovementQueryDto } from '../dto/stock-movement.dto';
import { AuthGuard } from '../guards/auth.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Request } from 'express';
import { User } from '../schemas/user.schema';

interface AuthenticatedRequest extends Request {
  user: User & { id: string };
}

@ApiTags('movements')
@ApiBearerAuth()
@Controller('movements')
@WebSocketGateway({ namespace: 'movements' })
@UseGuards(AuthGuard)
export class StockMovementController {
  @WebSocketServer()
  server: Server;

  constructor(private readonly stockMovementService: StockMovementService) {}

  @Post()
  @RequirePermissions({ service: 'movements', action: 'create' })
  @ApiOperation({ summary: 'Create a new stock movement' })
  async create(@Body(ValidationPipe) createDto: CreateStockMovementDto, @Req() req: AuthenticatedRequest) {
    const movement = await this.stockMovementService.create(createDto, req.user.id);
    // Emit real-time update
    this.server.emit('movement:created', movement);
    return movement;
  }

  @Post('bulk')
  @RequirePermissions({ service: 'movements', action: 'create' })
  @ApiOperation({ summary: 'Create multiple stock movements' })
  async createBulk(@Body(ValidationPipe) bulkCreateDto: BulkCreateStockMovementDto, @Req() req: AuthenticatedRequest) {
    const movements = await this.stockMovementService.createBulk(bulkCreateDto.movements, req.user.id);
    // Emit real-time update
    this.server.emit('movements:bulkCreated', movements);
    return movements;
  }

  @Get()
  @RequirePermissions({ service: 'movements', action: 'read' })
  @ApiOperation({ summary: 'Get all stock movements with filters and pagination' })
  async findAll(@Query(ValidationPipe) query: StockMovementQueryDto) {
    return this.stockMovementService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions({ service: 'movements', action: 'read' })
  @ApiOperation({ summary: 'Get a stock movement by ID' })
  async findOne(@Param('id') id: string) {
    return this.stockMovementService.findById(id);
  }

  @Put(':id')
  @RequirePermissions({ service: 'movements', action: 'update' })
  @ApiOperation({ summary: 'Update a stock movement' })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDto: UpdateStockMovementDto
  ) {
    const updated = await this.stockMovementService.update(id, updateDto);
    // Emit real-time update
    this.server.emit('movement:updated', updated);
    return updated;
  }

  @Put('bulk')
  @RequirePermissions({ service: 'movements', action: 'update' })
  @ApiOperation({ summary: 'Update multiple stock movements' })
  async updateBulk(@Body(ValidationPipe) updates: { id: string; data: UpdateStockMovementDto }[]) {
    const updatedMovements = await this.stockMovementService.updateBulk(updates);
    // Emit real-time update
    this.server.emit('movements:bulkUpdated', updatedMovements);
    return updatedMovements;
  }

  @Delete(':id')
  @RequirePermissions({ service: 'movements', action: 'delete' })
  @ApiOperation({ summary: 'Delete a stock movement' })
  async remove(@Param('id') id: string) {
    await this.stockMovementService.delete(id);
    // Emit real-time update
    this.server.emit('movement:deleted', id);
    return { message: 'Stock movement deleted successfully' };
  }

  @Delete('bulk')
  @RequirePermissions({ service: 'movements', action: 'delete' })
  @ApiOperation({ summary: 'Delete multiple stock movements' })
  async removeBulk(@Body() ids: string[]) {
    await this.stockMovementService.deleteBulk(ids);
    // Emit real-time update
    this.server.emit('movements:bulkDeleted', ids);
    return { message: 'Stock movements deleted successfully' };
  }

  @Put(':id/void')
  @RequirePermissions({ service: 'movements', action: 'update' })
  @ApiOperation({ summary: 'Void a stock movement' })
  async voidMovement(@Param('id') id: string) {
    const voided = await this.stockMovementService.voidMovement(id);
    // Emit real-time update
    this.server.emit('movement:voided', voided);
    return voided;
  }

  @Put(':id/cancel')
  @RequirePermissions({ service: 'movements', action: 'update' })
  @ApiOperation({ summary: 'Cancel a stock movement' })
  async cancelMovement(@Param('id') id: string) {
    const cancelled = await this.stockMovementService.cancelMovement(id);
    // Emit real-time update
    this.server.emit('movement:cancelled', cancelled);
    return cancelled;
  }
} 