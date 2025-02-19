import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user.module';
import { AuthModule } from './modules/auth.module';
import { InventoryModule } from './modules/inventory.module';
import { StatisticsModule } from './modules/statistics.module';
import { SupplierModule } from './modules/supplier.module';
import { LocationModule } from './modules/location.module';
import { DeliveryModule } from './modules/delivery.module';
import { DeliveryCompanyModule } from './modules/delivery-company.module';
import { TwoFactorModule } from './modules/two-factor.module';
import { SessionModule } from './modules/session.module';
import { StockMovementModule } from './modules/stock-movement.module';
import { MailerModule } from './modules/mailer.module';
import { SeedModule } from './seed/seed.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { StockAlertService } from './services/stock-alert.service';
import { StockAlertController } from './controllers/stock-alert.controller';
import { GeocodingModule } from './modules/geocoding.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot({
      // Set this to true to handle errors
      wildcard: true,
      // the delimiter used to segment namespaces
      delimiter: '.',
      // set this to true if you want to emit the newListener event
      newListener: false,
      // set this to true if you want to emit the removeListener event
      removeListener: false,
      // the maximum amount of listeners that can be assigned to an event
      maxListeners: 10,
      // show event name in memory leak message when more than maximum amount of listeners is assigned
      verboseMemoryLeak: false,
      // disable throwing uncaughtException if an error event is emitted and it has no listeners
      ignoreErrors: false,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    InventoryModule,
    StatisticsModule,
    SupplierModule,
    LocationModule,
    DeliveryModule,
    DeliveryCompanyModule,
    TwoFactorModule,
    SessionModule,
    StockMovementModule,
    MailerModule,
    SeedModule,
    ScheduleModule.forRoot(),
    GeocodingModule,
  ],
  controllers: [
    AppController,
    StockAlertController,
  ],
  providers: [
    AppService,
    StockAlertService,
  ],
})
export class AppModule {}
