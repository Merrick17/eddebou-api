import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { DeliveryCompany } from './delivery-company.schema';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { DeliveryPriority } from '../enums/delivery-priority.enum';

export type DeliveryDocument = Delivery & Document;

@Schema()
export class DeliveryLocation {
  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  postalCode: string;

  @Prop({ required: true })
  country: string;
}

@Schema()
export class DeliveryTracking {
  @Prop({
    type: {
      coordinates: [Number],
      address: String,
    },
  })
  currentLocation?: {
    coordinates: [number, number];
    address: string;
  };

  @Prop([{
    timestamp: { type: Date, required: true },
    status: { type: String, enum: Object.values(DeliveryStatus), required: true },
    location: {
      coordinates: [Number],
      address: String,
    },
    notes: String,
  }])
  history: Array<{
    timestamp: Date;
    status: DeliveryStatus;
    location?: {
      coordinates: [number, number];
      address: string;
    };
    notes?: string;
  }>;

  @Prop({ type: Date })
  actualDeliveryDate?: Date;
}

@Schema()
export class DeliveryItem {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'InventoryItem' })
  productId: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ required: true, min: 0 })
  taxRate: number;
}

@Schema()
export class DeliveryContact {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop()
  alternativePhone?: string;

  @Prop({ enum: ['email', 'phone', 'sms'] })
  preferredContactMethod?: string;
}

@Schema()
export class DeliveryWindow {
  @Prop({ required: true, type: Date })
  start: Date;

  @Prop({ required: true, type: Date })
  end: Date;
}

@Schema()
export class StatusUpdate {
  @Prop({
    required: true,
    enum: [
      'pending',
      'confirmed',
      'picked_up',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'failed',
      'returned',
      'cancelled',
      'voided'
    ],
  })
  status: string;

  @Prop({ required: true, type: Date, default: Date.now })
  timestamp: Date;

  @Prop()
  location?: string;

  @Prop()
  notes?: string;
}

@Schema()
export class DeliveryPayment {
  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ required: true, min: 0 })
  deliveryFee: number;

  @Prop({ required: true, min: 0 })
  tax: number;

  @Prop({ required: true, min: 0 })
  total: number;

  @Prop()
  paymentMethod?: string;

  @Prop({
    required: true,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  })
  paymentStatus: string;

  @Prop({ min: 0 })
  codAmount?: number;
}

@Schema()
export class DeliverySignature {
  @Prop({ required: true, default: false })
  required: boolean;

  @Prop()
  image?: string;

  @Prop()
  name?: string;

  @Prop({ type: Date })
  timestamp?: Date;
}

@Schema()
export class ProofOfDelivery {
  @Prop({ required: true })
  receivedBy: string;

  @Prop()
  signature?: string;

  @Prop({ type: [String] })
  photos?: string[];

  @Prop()
  notes?: string;
}

@Schema({ timestamps: true })
export class Delivery {
  @Prop({ required: true, unique: true })
  invoiceNumber: string;

  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  customerEmail: string;

  @Prop({ required: true })
  customerPhone: string;

  @Prop({ type: DeliveryLocation, required: true })
  deliveryLocation: DeliveryLocation;

  @Prop({ type: [DeliveryItem], required: true })
  items: DeliveryItem[];

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'DeliveryCompany' })
  deliveryCompanyId: string;

  @Prop({ required: true, min: 0 })
  vatRate: number;

  @Prop([{
    taxName: { type: String, required: true },
    rate: { type: Number, required: true, min: 0 },
  }])
  additionalTaxes?: Array<{
    taxName: string;
    rate: number;
  }>;

  @Prop()
  notes?: string;

  @Prop({ type: Date })
  preferredDeliveryDate?: Date;

  @Prop({ required: true, enum: Object.values(DeliveryStatus), default: DeliveryStatus.PENDING })
  status: DeliveryStatus;

  @Prop({ type: DeliveryTracking, required: true })
  tracking: DeliveryTracking;

  @Prop({ type: ProofOfDelivery })
  proofOfDelivery?: ProofOfDelivery;

  createdAt: Date;
  updatedAt: Date;
}

export const DeliverySchema = SchemaFactory.createForClass(Delivery); 