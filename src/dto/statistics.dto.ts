import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StatisticsQueryDto {
  @ApiPropertyOptional({ description: 'Time period for statistics', enum: ['daily', 'weekly', 'monthly', 'yearly'] })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly', 'yearly'])
  period?: string = 'monthly';

  @ApiPropertyOptional({ description: 'Start date for custom range' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for custom range' })
  @IsOptional()
  @IsString()
  endDate?: string;
} 