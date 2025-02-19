import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { MovementType } from '../enums/movement-type.enum';
import { MovementStatus } from '../enums/movement-status.enum';

export type StockMovementDocument = StockMovement & Document;

@Schema({ timestamps: true })
export class StockMovement {
  @Prop({ required: true, enum: MovementType })
  type: MovementType;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'InventoryItem' })
  itemId: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Location' })
  locationId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Location' })
  toLocationId?: string;

  @Prop({ required: true })
  reason: string;

  @Prop()
  reference?: string;

  @Prop()
  notes?: string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy: string;

  @Prop({ default: MovementStatus.PENDING, enum: MovementStatus })
  status: MovementStatus;

  // New fields for batch tracking
  @Prop()
  batchNumber?: string;

  @Prop()
  expiryDate?: Date;

  @Prop()
  manufacturingDate?: Date;

  @Prop({ type: Object })
  qualityChecks?: {
    checkedBy: string;
    checkedAt: Date;
    passed: boolean;
    notes: string;
  };

  // Cost tracking
  @Prop()
  unitCost?: number;

  @Prop()
  totalCost?: number;

  // Alert thresholds
  @Prop()
  minimumThreshold?: number;

  @Prop()
  maximumThreshold?: number;

  @Prop({ type: [String] })
  tags?: string[];

  @Prop()
  voidedAt?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  voidedBy?: string;

  @Prop()
  cancelledAt?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  cancelledBy?: string;
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovement); 