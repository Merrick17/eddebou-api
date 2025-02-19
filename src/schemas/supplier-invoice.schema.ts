import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { InventoryItem } from './inventory-item.schema';
import { Supplier } from './supplier.schema';

export class InvoiceItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'InventoryItem', required: true })
  itemId: InventoryItem;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  buyingPrice: number;

  @Prop({ required: true, min: 0 })
  totalPrice: number;

  @Prop({ required: true, min: 0, default: 0 })
  taxRate: number;

  @Prop({ required: true, min: 0, default: 0 })
  taxAmount: number;
}

export type SupplierInvoiceDocument = SupplierInvoice & Document;

@Schema({ timestamps: true })
export class SupplierInvoice {
  @Prop({ required: true, unique: true })
  invoiceRef: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Supplier', required: true })
  supplierId: Supplier;

  @Prop({ type: [{ type: InvoiceItem }], required: true })
  items: InvoiceItem[];

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ required: true, min: 0 })
  vatRate: number;

  @Prop({ required: true, min: 0 })
  vatAmount: number;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ type: [{ 
    taxName: { type: String, required: true },
    rate: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 }
  }], default: [] })
  additionalTaxes: Array<{
    taxName: string;
    rate: number;
    amount: number;
  }>;

  @Prop({ required: true })
  invoiceDate: Date;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ default: 'pending', enum: ['pending', 'paid', 'cancelled'] })
  status: string;

  @Prop()
  notes?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: string;

  @Prop({ type: Boolean, default: false })
  isReconciled: boolean;

  @Prop({ type: Date })
  reconciledAt?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  reconciledBy?: string;
}

export const SupplierInvoiceSchema = SchemaFactory.createForClass(SupplierInvoice); 