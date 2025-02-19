import { Module, forwardRef } from '@nestjs/common';
import { StockMovementService } from '../services/stock-movement.service';
import { StockMovementController } from '../controllers/stock-movement.controller';
import { InventoryModule } from './inventory.module';
import { CoreModule } from './core.module';

@Module({
  imports: [
    CoreModule,
    forwardRef(() => InventoryModule)
  ],
  controllers: [StockMovementController],
  providers: [StockMovementService],
  exports: [StockMovementService]
})
export class StockMovementModule {} 