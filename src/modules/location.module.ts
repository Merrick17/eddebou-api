import { Module, forwardRef } from '@nestjs/common';
import { LocationController } from '../controllers/location.controller';
import { LocationService } from '../services/location.service';
import { CoreModule } from './core.module';
import { InventoryModule } from './inventory.module';
import { StockMovementModule } from './stock-movement.module';

@Module({
  imports: [
    CoreModule,
    forwardRef(() => InventoryModule),
    forwardRef(() => StockMovementModule)
  ],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {} 