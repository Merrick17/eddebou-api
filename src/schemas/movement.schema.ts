import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { MovementType } from '../enums/movement-type.enum';
import { MovementStatus } from '../enums/movement-status.enum';

@Schema({ timestamps: true })
export class Movement {
  @Prop({ required: true, enum: MovementType })
  type: MovementType;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Item' })
  itemId: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Location' })
  locationId: string;

  @Prop({ default: Date.now })
  date: Date;

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
}

export type MovementDocument = Movement & Document;
export const MovementSchema = SchemaFactory.createForClass(Movement); 