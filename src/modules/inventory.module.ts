import { Module, forwardRef } from '@nestjs/common';
import { InventoryController } from '../controllers/inventory.controller';
import { InventoryService } from '../services/inventory.service';
import { LocationModule } from './location.module';
import { StockMovementModule } from './stock-movement.module';
import { CoreModule } from './core.module';

@Module({
  imports: [
    CoreModule,
    LocationModule,
    forwardRef(() => StockMovementModule),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {} 