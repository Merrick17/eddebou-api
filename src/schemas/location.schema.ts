import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LocationDocument = Location & Document;

@Schema({ timestamps: true })
export class Location {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true, min: 0 })
  capacity: number;

  @Prop({ default: 0, min: 0 })
  usedCapacity: number;

  @Prop({ 
    required: true, 
    enum: ['warehouse', 'store', 'distribution_center', 'distribution-center'], 
    default: 'warehouse' 
  })
  type: string;

  @Prop()
  description?: string;

  @Prop({ required: true, enum: ['active', 'inactive'], default: 'active' })
  status: string;
}

export const LocationSchema = SchemaFactory.createForClass(Location); 