import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StockMovement, StockMovementDocument } from '../schemas/stock-movement.schema';
import { CreateStockMovementDto, StockMovementQueryDto, UpdateStockMovementDto } from '../dto/stock-movement.dto';
import { InventoryService } from './inventory.service';
import { MovementStatus } from '../enums/movement-status.enum';

@Injectable()
export class StockMovementService {
  constructor(
    @InjectModel(StockMovement.name) private stockMovementModel: Model<StockMovementDocument>,
    @Inject(forwardRef(() => InventoryService))
    private readonly inventoryService: InventoryService
  ) {}

  async create(createDto: CreateStockMovementDto, userId: string): Promise<StockMovement> {
    try {
      const movement = new this.stockMovementModel({
        ...createDto,
        createdBy: userId,
        status: MovementStatus.PENDING
      });

      await movement.save();
      return await this.stockMovementModel.findById(movement._id)
        .populate('itemId')
        .populate('locationId')
        .populate('toLocationId')
        .populate('createdBy')
        .populate('voidedBy')
        .populate('cancelledBy');
    } catch (error) {
      throw error;
    }
  }

  async createBulk(movements: CreateStockMovementDto[], userId: string): Promise<StockMovement[]> {
    try {
      const createdMovements = await this.stockMovementModel.create(
        movements.map(dto => ({
          ...dto,
          createdBy: userId,
          status: MovementStatus.PENDING
        }))
      );

      const movementsArray = Array.isArray(createdMovements) ? createdMovements : [createdMovements];
      const populatedMovements = await Promise.all(
        movementsArray.map(movement => 
          this.stockMovementModel.findById(movement._id)
            .populate('itemId')
            .populate('locationId')
            .populate('toLocationId')
            .populate('createdBy')
            .populate('voidedBy')
            .populate('cancelledBy')
        )
      );

      return populatedMovements.filter(m => m !== null) as StockMovement[];
    } catch (error) {
      throw error;
    }
  }

  async findAll(query: StockMovementQueryDto) {
    const { page = 1, limit = 10, search, type, status, fromLocation, toLocation, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (search) filter.$text = { $search: search };
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (fromLocation) filter.fromLocation = fromLocation;
    if (toLocation) filter.toLocation = toLocation;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const [movements, total] = await Promise.all([
      this.stockMovementModel
        .find(filter)
        .populate('itemId')
        .populate('locationId')
        .populate('toLocationId')
        .populate('createdBy')
        .populate('voidedBy')
        .populate('cancelledBy')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.stockMovementModel.countDocuments(filter)
    ]);

    return {
      movements,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findById(id: string): Promise<StockMovement> {
    const movement = await this.stockMovementModel.findById(id)
      .populate('itemId')
      .populate('locationId')
      .populate('toLocationId')
      .populate('createdBy')
      .populate('voidedBy')
      .populate('cancelledBy');
      
    if (!movement) {
      throw new NotFoundException(`Stock movement #${id} not found`);
    }
    return movement;
  }

  async update(id: string, updateDto: UpdateStockMovementDto): Promise<StockMovement> {
    const movement = await this.stockMovementModel.findByIdAndUpdate(
      id,
      { $set: updateDto },
      { new: true }
    )
    .populate('itemId')
    .populate('locationId')
    .populate('toLocationId')
    .populate('createdBy')
    .populate('voidedBy')
    .populate('cancelledBy');

    if (!movement) {
      throw new NotFoundException(`Stock movement #${id} not found`);
    }
    return movement;
  }

  async updateBulk(updates: { id: string; data: UpdateStockMovementDto }[]): Promise<StockMovementDocument[]> {
    try {
      const updatedMovements = await Promise.all(
        updates.map(({ id, data }) =>
          this.stockMovementModel.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true }
          )
          .populate('itemId')
          .populate('locationId')
          .populate('toLocationId')
          .populate('createdBy')
          .populate('voidedBy')
          .populate('cancelledBy')
        )
      );

      return updatedMovements.filter(m => m !== null) as StockMovementDocument[];
    } catch (error) {
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.stockMovementModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Stock movement #${id} not found`);
    }
  }

  async deleteBulk(ids: string[]): Promise<void> {
    const result = await this.stockMovementModel.deleteMany({ _id: { $in: ids } });
    if (result.deletedCount === 0) {
      throw new NotFoundException('No stock movements found to delete');
    }
  }

  async voidMovement(id: string): Promise<StockMovement> {
    const movement = await this.stockMovementModel.findByIdAndUpdate(
      id,
      { $set: { status: MovementStatus.VOIDED } },
      { new: true }
    );
    if (!movement) {
      throw new NotFoundException(`Stock movement #${id} not found`);
    }
    return movement;
  }

  async cancelMovement(id: string): Promise<StockMovement> {
    const movement = await this.stockMovementModel.findByIdAndUpdate(
      id,
      { $set: { status: MovementStatus.CANCELLED } },
      { new: true }
    );
    if (!movement) {
      throw new NotFoundException(`Stock movement #${id} not found`);
    }
    return movement;
  }
} 