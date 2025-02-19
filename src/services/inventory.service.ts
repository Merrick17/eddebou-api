import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InventoryItem, InventoryItemDocument } from '../schemas/inventory-item.schema';
import { CreateInventoryItemDto, UpdateInventoryItemDto, InventoryQueryDto } from '../dto/inventory.dto';
import { StockMovementService } from './stock-movement.service';
import { MovementType } from '../enums/movement-type.enum';

// Add a constant for system user ID (use a valid ObjectId)
const SYSTEM_USER_ID = '000000000000000000000000'; // 24-character hex string

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(InventoryItem.name)
    private inventoryModel: Model<InventoryItemDocument>,
    @Inject(forwardRef(() => StockMovementService))
    private stockMovementService: StockMovementService,
  ) {}

  async create(createDto: CreateInventoryItemDto): Promise<InventoryItem> {
    try {
      // Create the inventory item
      const newItem = new this.inventoryModel({
        ...createDto,
        status: this.updateItemStatus(createDto.currentStock, createDto.minStock)
      });
      
      const savedItem = await newItem.save();

      // If initial stock is greater than 0, create a stock movement record
      if (createDto.currentStock > 0) {
        try {
          await this.stockMovementService.create({
            itemId: savedItem._id.toString(),
            quantity: createDto.currentStock,
            type: MovementType.IN,
            reason: 'Initial stock',
            locationId: createDto.location || 'default-location-id',
            date: new Date()
          }, SYSTEM_USER_ID);
        } catch (movementError) {
          // If creating movement fails, log it but don't fail the item creation
          console.error('Failed to create initial stock movement:', movementError);
        }
      }

      return savedItem;
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('SKU already exists');
      }
      throw error;
    }
  }

  async findAll(query: InventoryQueryDto) {
    const { page = 1, limit = 10, search, category, status } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      this.inventoryModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.inventoryModel.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, updateDto: UpdateInventoryItemDto): Promise<InventoryItem> {
    try {
      // Find the current item first
      const currentItem = await this.inventoryModel.findById(id);
      if (!currentItem) {
        throw new NotFoundException(`Inventory item with ID ${id} not found`);
      }

      // If stock is being updated, update the status
      const updateData: any = { ...updateDto };
      if (typeof updateDto.currentStock !== 'undefined') {
        updateData.status = this.updateItemStatus(
          updateDto.currentStock,
          updateDto.minStock || currentItem.minStock
        );
      }

      // Perform the update
      const updated = await this.inventoryModel
        .findByIdAndUpdate(
          id,
          { $set: { ...updateData, updatedAt: new Date() } },
          { new: true, runValidators: true }
        )
        .exec();

      if (!updated) {
        throw new NotFoundException(`Inventory item with ID ${id} not found`);
      }

      // If stock was updated, create a movement record
      if (typeof updateDto.currentStock !== 'undefined' && updateDto.currentStock !== currentItem.currentStock) {
        const stockDifference = updateDto.currentStock - currentItem.currentStock;
        try {
          await this.stockMovementService.create({
            itemId: id,
            quantity: Math.abs(stockDifference),
            type: stockDifference > 0 ? MovementType.IN : MovementType.OUT,
            reason: 'Manual stock adjustment',
            locationId: currentItem.get('location') || 'default-location-id',
            date: new Date()
          }, SYSTEM_USER_ID);
        } catch (movementError) {
          console.error('Failed to create stock movement for update:', movementError);
        }
      }

      return updated;
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('SKU already exists');
      }
      throw error;
    }
  }

  async delete(id: string): Promise<{ id: string }> {
    const result = await this.inventoryModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }
    return { id };
  }

  async findById(id: string): Promise<InventoryItem> {
    const item = await this.inventoryModel.findById(id).exec();
    if (!item) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }
    return item;
  }

  async updateStock(itemId: string, quantity: number): Promise<void> {
    const result = await this.inventoryModel.updateOne(
      { _id: itemId },
      { $inc: { currentStock: quantity } }
    );

    if (result.modifiedCount === 0) {
      throw new NotFoundException(`Inventory item ${itemId} not found`);
    }
  }

  async updateBuyingPrice(itemId: string, buyingPrice: number): Promise<void> {
    const result = await this.inventoryModel.updateOne(
      { _id: itemId },
      { $set: { buyingPrice: buyingPrice } }
    );

    if (result.modifiedCount === 0) {
      throw new NotFoundException(`Inventory item ${itemId} not found`);
    }
  }

  private updateItemStatus(currentStock: number, minStock: number): string {
    if (currentStock === 0) return 'out_of_stock';
    if (currentStock <= minStock) return 'low_stock';
    return 'in_stock';
  }

  async createMovement(itemId: string, quantity: number) {
    const item = await this.findById(itemId);
    if (!item) {
      throw new NotFoundException(`Inventory item ${itemId} not found`);
    }

    // Create movement
    const movement = {
      type: quantity > 0 ? MovementType.IN : MovementType.OUT,
      itemId,
      quantity: Math.abs(quantity),
      reason: quantity > 0 ? 'Stock increase' : 'Stock decrease',
      date: new Date()
    };

    return movement;
  }
} 