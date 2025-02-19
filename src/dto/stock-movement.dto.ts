import { IsString, IsNumber, IsEnum, IsArray, ValidateNested, IsOptional, IsDate, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MovementType } from '../enums/movement-type.enum';
import { MovementStatus } from '../enums/movement-status.enum';

export class StockMovementItemDto {
  @ApiProperty({ description: 'ID of the inventory item' })
  @IsString()
  itemId: string;

  @ApiProperty({ description: 'Quantity of items', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Location ID' })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({ description: 'Movement date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date?: Date;

  @ApiPropertyOptional({ description: 'Unit cost for the movement' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional({ description: 'Batch or lot number' })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Expiration date for the batch' })
  @IsOptional()
  @IsString()
  expirationDate?: string;
}

export class CreateStockMovementDto {
  @ApiProperty({ description: 'Type of movement', enum: MovementType })
  @IsEnum(MovementType)
  type: MovementType;

  @ApiProperty({ description: 'ID of the inventory item' })
  @IsString()
  itemId: string;

  @ApiProperty({ description: 'Quantity of items', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Source location ID' })
  @IsString()
  locationId: string;

  @ApiPropertyOptional({ description: 'Movement date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date?: Date;

  @ApiProperty({ description: 'Reason for the movement' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Reference number' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

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
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Updated reference number' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ description: 'Updated notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkCreateStockMovementDto {
  @ApiProperty({ description: 'Stock movements to create', type: [CreateStockMovementDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStockMovementDto)
  movements: CreateStockMovementDto[];
}

export class StockMovementQueryDto {
  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Movement type', enum: MovementType })
  @IsOptional()
  @IsEnum(MovementType)
  type?: MovementType;

  @ApiPropertyOptional({ description: 'Movement status', enum: MovementStatus })
  @IsOptional()
  @IsEnum(MovementStatus)
  status?: MovementStatus;

  @ApiPropertyOptional({ description: 'Source location ID' })
  @IsOptional()
  @IsString()
  fromLocation?: string;

  @ApiPropertyOptional({ description: 'Destination location ID' })
  @IsOptional()
  @IsString()
  toLocation?: string;

  @ApiPropertyOptional({ description: 'Reference number' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Sort by field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
} 