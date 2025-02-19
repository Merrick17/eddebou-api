import { Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards, ValidationPipe, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveryService } from '../services/delivery.service';
import { CreateDeliveryDto, UpdateDeliveryDto, BulkCreateDeliveryDto, DeliveryQueryDto, GetDeliveriesResponse } from '../dto/delivery.dto';
import { AuthGuard } from '../guards/auth.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { DeliveryStatus } from '../enums/delivery-status.enum';

@ApiTags('deliveries')
@ApiBearerAuth()
@Controller('deliveries')
@WebSocketGateway({ namespace: 'deliveries', cors: true })
@UseGuards(AuthGuard)
export class DeliveryController implements OnGatewayInit {
  private readonly logger = new Logger(DeliveryController.name);
  
  @WebSocketServer()
  private server: Server;

  constructor(private readonly deliveryService: DeliveryService) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  private safeEmit(event: string, data: any) {
    try {
      this.server?.emit(event, data);
    } catch (error) {
      this.logger.error(`Failed to emit ${event}:`, error);
    }
  }

  @Post()
  @RequirePermissions({ service: 'deliveries', action: 'create' })
  @ApiOperation({ summary: 'Create a new delivery' })
  async create(@Body(ValidationPipe) createDto: CreateDeliveryDto) {
    const delivery = await this.deliveryService.create(createDto);
    this.safeEmit('delivery:created', delivery);
    return delivery;
  }

  @Get()
  @RequirePermissions({ service: 'deliveries', action: 'read' })
  @ApiOperation({ summary: 'Get all deliveries with filters and pagination' })
  async findAll(@Query(ValidationPipe) query: DeliveryQueryDto): Promise<GetDeliveriesResponse> {
    return this.deliveryService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions({ service: 'deliveries', action: 'read' })
  @ApiOperation({ summary: 'Get a delivery by ID' })
  async findById(@Param('id') id: string) {
    return this.deliveryService.findById(id);
  }

  @Put(':id')
  @RequirePermissions({ service: 'deliveries', action: 'update' })
  @ApiOperation({ summary: 'Update a delivery' })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDto: UpdateDeliveryDto
  ) {
    const updated = await this.deliveryService.update(id, updateDto);
    this.safeEmit('delivery:updated', updated);
    return updated;
  }

  @Put(':id/status')
  @RequirePermissions({ service: 'deliveries', action: 'update' })
  @ApiOperation({ summary: 'Update delivery status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: DeliveryStatus,
    @Body('notes') notes?: string,
    @Body('location') location?: { coordinates: [number, number]; address: string }
  ) {
    const updated = await this.deliveryService.updateStatus(id, status, notes, location);
    this.safeEmit('delivery:statusUpdated', updated);
    return updated;
  }

  @Post('bulk')
  @RequirePermissions({ service: 'deliveries', action: 'create' })
  @ApiOperation({ summary: 'Create multiple deliveries' })
  async bulkCreate(@Body(ValidationPipe) bulkCreateDto: BulkCreateDeliveryDto) {
    const deliveries = await this.deliveryService.createBulk(bulkCreateDto.deliveries);
    this.safeEmit('deliveries:bulkCreated', deliveries);
    return deliveries;
  }

  @Put('bulk/update')
  @RequirePermissions({ service: 'deliveries', action: 'update' })
  @ApiOperation({ summary: 'Update multiple deliveries' })
  async bulkUpdate(@Body() updates: { id: string; data: UpdateDeliveryDto }[]) {
    const updated = await this.deliveryService.updateBulk(updates);
    this.safeEmit('deliveries:bulkUpdated', updated);
    return updated;
  }

  @Delete(':id')
  @RequirePermissions({ service: 'deliveries', action: 'delete' })
  @ApiOperation({ summary: 'Delete a delivery' })
  async delete(@Param('id') id: string) {
    await this.deliveryService.delete(id);
    this.safeEmit('delivery:deleted', id);
    return { message: 'Delivery deleted successfully' };
  }

  @Put(':id/void')
  @RequirePermissions({ service: 'deliveries', action: 'update' })
  @ApiOperation({ summary: 'Void a delivery' })
  async voidDelivery(@Param('id') id: string) {
    const voided = await this.deliveryService.voidDelivery(id);
    this.safeEmit('delivery:voided', voided);
    return voided;
  }

  @Put(':id/proof-of-delivery')
  @RequirePermissions({ service: 'deliveries', action: 'update' })
  @ApiOperation({ summary: 'Add proof of delivery' })
  async addProofOfDelivery(
    @Param('id') id: string,
    @Body() proofOfDelivery: {
      receivedBy: string;
      signature?: string;
      photos?: string[];
      notes?: string;
    }
  ) {
    const updated = await this.deliveryService.addProofOfDelivery(id, proofOfDelivery);
    this.safeEmit('delivery:proofAdded', updated);
    return updated;
  }
}