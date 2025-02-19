import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeliveryCompanyController } from '../controllers/delivery-company.controller';
import { DeliveryCompanyService } from '../services/delivery-company.service';
import { DeliveryCompany, DeliveryCompanySchema } from '../schemas/delivery-company.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DeliveryCompany.name, schema: DeliveryCompanySchema },
    ]),
  ],
  controllers: [DeliveryCompanyController],
  providers: [DeliveryCompanyService],
  exports: [DeliveryCompanyService],
})
export class DeliveryCompanyModule {} 