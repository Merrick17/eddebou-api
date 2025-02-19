import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StockMovement, StockMovementSchema } from '../schemas/stock-movement.schema';
import { InventoryItem, InventoryItemSchema } from '../schemas/inventory-item.schema';
import { Location, LocationSchema } from '../schemas/location.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StockMovement.name, schema: StockMovementSchema },
      { name: InventoryItem.name, schema: InventoryItemSchema },
      { name: Location.name, schema: LocationSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class CoreModule {} 