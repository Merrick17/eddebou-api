import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Movement } from '../schemas/movement.schema';
import { CreateStockMovementDto } from '../dto/stock-movement.dto';
import { MovementType } from '../enums/movement-type.enum';

@Injectable()
export class MovementService {
  constructor(
    @InjectModel('Movement') private movementModel: Model<Movement>
  ) {}

  async create(createDto: CreateStockMovementDto, userId: string): Promise<Movement> {
    const session = await this.movementModel.db.startSession();
    session.startTransaction();

    try {
      const movement = new this.movementModel({
        type: createDto.type,
        itemId: createDto.itemId,
        quantity: createDto.quantity,
        locationId: createDto.locationId,
        date: createDto.date || new Date(),
        reason: createDto.reason,
        reference: createDto.reference,
        notes: createDto.notes,
        createdBy: userId
      });

      await movement.save({ session });
      await session.commitTransaction();
      return movement;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}