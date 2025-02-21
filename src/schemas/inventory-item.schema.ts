import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Supplier } from './supplier.schema';
import { Location } from './location.schema';

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

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Supplier' })
  supplier?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Location' })
  location?: string;

  @Prop({ type: String })
  image?: string;

  @Prop({ required: true })
  barcode: string;

  @Prop({ required: true, min: 0 })
  taxRate: number;

  @Prop({ required: true, default: false })
  taxInclusive: boolean;

  @Prop({ 
    required: true, 
    enum: ['in_stock', 'low_stock', 'out_of_stock'],
    default: 'in_stock'
  })
  status: string;
}

export const InventoryItemSchema = SchemaFactory.createForClass(InventoryItem); 