import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SupplierController } from '../controllers/supplier.controller';
import { SupplierService } from '../services/supplier.service';
import { Supplier, SupplierSchema } from '../schemas/supplier.schema';
import { SupplierInvoice, SupplierInvoiceSchema } from '../schemas/supplier-invoice.schema';
import { SupplierInvoiceController } from '../controllers/supplier-invoice.controller';
import { SupplierInvoiceService } from '../services/supplier-invoice.service';
import { InventoryModule } from './inventory.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Supplier.name, schema: SupplierSchema },
      { name: SupplierInvoice.name, schema: SupplierInvoiceSchema },
    ]),
    InventoryModule,
  ],
  controllers: [SupplierController, SupplierInvoiceController],
  providers: [SupplierService, SupplierInvoiceService],
  exports: [SupplierService, SupplierInvoiceService],
})
export class SupplierModule {} 