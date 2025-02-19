import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeliveryController } from '../controllers/delivery.controller';
import { DeliveryService } from '../services/delivery.service';
import { DeliveryTrackingService } from '../services/delivery-tracking.service';
import { RouteOptimizationService } from '../services/route-optimization.service';
import { Delivery, DeliverySchema } from '../schemas/delivery.schema';
import { DeliveryCompany, DeliveryCompanySchema } from '../schemas/delivery-company.schema';
import { InventoryItem, InventoryItemSchema } from '../schemas/inventory-item.schema';
import { GeocodingModule } from './geocoding.module';
import { MailerModule } from './mailer.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Delivery.name, schema: DeliverySchema },
      { name: DeliveryCompany.name, schema: DeliveryCompanySchema },
      { name: InventoryItem.name, schema: InventoryItemSchema },
    ]),
    GeocodingModule,
    MailerModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [DeliveryController],
  providers: [
    DeliveryService,
    DeliveryTrackingService,
    RouteOptimizationService,
  ],
  exports: [DeliveryService, DeliveryTrackingService, RouteOptimizationService],
})
export class DeliveryModule {} 