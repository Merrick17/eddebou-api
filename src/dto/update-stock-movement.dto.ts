import { IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MovementStatus } from '../enums/movement-status.enum';
import { StockMovementItemDto } from './stock-movement.dto';

export class UpdateStockMovementDto {
  @ApiPropertyOptional({ description: 'New status', enum: MovementStatus })
  @IsOptional()
  @IsEnum(MovementStatus)
  status?: MovementStatus;

  @ApiPropertyOptional({ description: 'Updated items', type: [StockMovementItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockMovementItemDto)
  items?: StockMovementItemDto[];

  @ApiPropertyOptional({ description: 'Updated reason' })
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: 'Updated reference number' })
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({ description: 'Updated notes' })
  @IsOptional()
  notes?: string;
} 