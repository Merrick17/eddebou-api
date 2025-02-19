import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatisticsController } from '../controllers/statistics.controller';
import { StatisticsService } from '../services/statistics.service';
import { InventoryItem, InventoryItemSchema } from '../schemas/inventory-item.schema';
import { SupplierInvoice, SupplierInvoiceSchema } from '../schemas/supplier-invoice.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Delivery, DeliverySchema } from '../schemas/delivery.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InventoryItem.name, schema: InventoryItemSchema },
      { name: SupplierInvoice.name, schema: SupplierInvoiceSchema },
      { name: User.name, schema: UserSchema },
      { name: Delivery.name, schema: DeliverySchema },
    ]),
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {} 