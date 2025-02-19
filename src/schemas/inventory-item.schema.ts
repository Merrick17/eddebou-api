import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InventoryItemDocument = InventoryItem & Document;

@Schema({ timestamps: true })
export class InventoryItem {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  sku: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true, min: 0 })
  currentStock: number;

  @Prop({ required: true, min: 0 })
  minStock: number;

  @Prop({ required: true, min: 0 })
  maxStock: number;

  @Prop({ required: true, min: 0 })
  buyingPrice: number;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ type: String })
  image?: string;
}

export const InventoryItemSchema = SchemaFactory.createForClass(InventoryItem); 