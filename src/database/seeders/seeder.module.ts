import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SeederService } from './seeder.service';
import { User, UserSchema } from '../../schemas/user.schema';
import { InventoryItem, InventoryItemSchema } from '../../schemas/inventory-item.schema';
import { Location, LocationSchema } from '../../schemas/location.schema';
import { Supplier, SupplierSchema } from '../../schemas/supplier.schema';
import { SupplierInvoice, SupplierInvoiceSchema } from '../../schemas/supplier-invoice.schema';
import { DeliveryCompany, DeliveryCompanySchema } from '../../schemas/delivery-company.schema';
import { StockMovement, StockMovementSchema } from '../../schemas/stock-movement.schema';
import { Movement, MovementSchema } from '../../schemas/movement.schema';
import { Delivery, DeliverySchema } from '../../schemas/delivery.schema';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: InventoryItem.name, schema: InventoryItemSchema },
      { name: Location.name, schema: LocationSchema },
      { name: Supplier.name, schema: SupplierSchema },
      { name: SupplierInvoice.name, schema: SupplierInvoiceSchema },
      { name: DeliveryCompany.name, schema: DeliveryCompanySchema },
      { name: StockMovement.name, schema: StockMovementSchema },
      { name: Movement.name, schema: MovementSchema },
      { name: Delivery.name, schema: DeliverySchema },
    ]),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {} 