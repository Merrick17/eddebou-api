import { Module } from '@nestjs/common';
import { TwoFactorService } from '../services/two-factor.service';
import { TwoFactorController } from '../controllers/two-factor.controller';
import { UserModule } from './user.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    UserModule,
    ConfigModule
  ],
  controllers: [TwoFactorController],
  providers: [TwoFactorService],
  exports: [TwoFactorService]
})
export class TwoFactorModule {} 