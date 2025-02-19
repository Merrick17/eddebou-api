import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DeliveryCompanyDocument = DeliveryCompany & Document;

@Schema({ timestamps: true })
export class DeliveryCompany {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  contactPerson: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  address: string;

  @Prop({ 
    required: true, 
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  })
  status: string;

  @Prop({ 
    required: true,
    min: 0,
    max: 5,
    default: 0
  })
  rating: number;

  @Prop({ required: false, default: '' })
  notes: string;
}

export const DeliveryCompanySchema = SchemaFactory.createForClass(DeliveryCompany); 