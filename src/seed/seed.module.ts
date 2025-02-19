import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { InventoryItem, InventoryItemSchema } from '../schemas/inventory-item.schema';
import { Location, LocationSchema } from '../schemas/location.schema';
import { Supplier, SupplierSchema } from '../schemas/supplier.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { DeliveryCompany, DeliveryCompanySchema } from '../schemas/delivery-company.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InventoryItem.name, schema: InventoryItemSchema },
      { name: Location.name, schema: LocationSchema },
      { name: Supplier.name, schema: SupplierSchema },
      { name: User.name, schema: UserSchema },
      { name: DeliveryCompany.name, schema: DeliveryCompanySchema },
    ]),
  ],
  providers: [SeedService],
  controllers: [SeedController],
})
export class SeedModule {} 