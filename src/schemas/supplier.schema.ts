import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SupplierDocument = Supplier & Document;

@Schema({ timestamps: true })
export class Supplier {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  address: string;

  @Prop()
  notes?: string;

  @Prop({ required: false })
  contactPerson?: string;

  @Prop()
  paymentTerms?: string;

  @Prop()
  taxId?: string;

  @Prop({ required: true, enum: ['active', 'inactive'], default: 'active' })
  status: string;

  @Prop({ min: 0, max: 5 })
  rating?: number;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier); 