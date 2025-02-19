import { IsString, IsNumber, IsDate, IsEnum, IsArray, ValidateNested, IsOptional, Min, IsBoolean, IsDateString, IsEmail, IsPhoneNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { Delivery } from '../types/api';

class AdditionalTaxDto {
  @ApiProperty({ description: 'Name of the tax' })
  @IsString()
  taxName: string;

  @ApiProperty({ description: 'Tax rate percentage', minimum: 0 })
  @IsNumber()
  @Min(0)
  rate: number;
}

export class DeliveryItemDto {
  @ApiProperty({ description: 'ID of the inventory item' })
  @IsString()
  itemId: string;

  @ApiProperty({ description: 'Quantity of items', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Unit price', minimum: 0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ description: 'Tax rate for this item', minimum: 0 })
  @IsNumber()
  @Min(0)
  taxRate: number;
}

export class DeliveryLocationDto {
  @ApiProperty({ description: 'Address of the delivery location' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'City of the delivery location' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'State of the delivery location' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'Postal code of the delivery location' })
  @IsString()
  postalCode: string;

  @ApiProperty({ description: 'Country of the delivery location' })
  @IsString()
  country: string;
}

export class UpdateDeliveryDto {
  @ApiPropertyOptional({ description: 'Current status of delivery', enum: DeliveryStatus })
  @IsOptional()
  @IsEnum(DeliveryStatus)
  status?: DeliveryStatus;

  @ApiPropertyOptional({ description: 'Notes about the status update' })
  @IsOptional()
  @IsString()
  statusNotes?: string;

  @ApiPropertyOptional({ description: 'Location at the time of status update' })
  @IsOptional()
  @IsDate()
  statusLocation?: {
    coordinates: [number, number];
    address: string;
  };

  @ApiPropertyOptional({ description: 'Tracking number' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({ description: 'Whether the delivery has been reconciled' })
  @IsOptional()
  @IsBoolean()
  isReconciled?: boolean;

  @ApiPropertyOptional({ description: 'Date of reconciliation' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  reconciledAt?: Date;

  @ApiPropertyOptional({ description: 'User who reconciled the delivery' })
  @IsOptional()
  @IsString()
  reconciledBy?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateDeliveryDto {
  @ApiProperty({ description: 'Customer name' })
  @IsString()
  customerName: string;

  @ApiProperty({ description: 'Customer email' })
  @IsEmail()
  customerEmail: string;

  @ApiProperty({ description: 'Customer phone number' })
  @IsPhoneNumber()
  customerPhone: string;

  @ApiProperty({ description: 'Delivery location details' })
  @ValidateNested()
  @Type(() => DeliveryLocationDto)
  deliveryLocation: DeliveryLocationDto;

  @ApiProperty({ description: 'Array of items in the delivery' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryItemDto)
  items: DeliveryItemDto[];

  @ApiProperty({ description: 'Delivery company ID' })
  @IsString()
  deliveryCompanyId: string;

  @ApiProperty({ description: 'VAT rate percentage', minimum: 0 })
  @IsNumber()
  @Min(0)
  vatRate: number;

  @ApiPropertyOptional({ description: 'Additional taxes to apply' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalTaxDto)
  additionalTaxes?: AdditionalTaxDto[];

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Preferred delivery date' })
  @IsOptional()
  @IsDateString()
  preferredDeliveryDate?: string;
}

export class BulkCreateDeliveryDto {
  @ApiProperty({ description: 'Deliveries to be created', type: [CreateDeliveryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDeliveryDto)
  deliveries: CreateDeliveryDto[];
}

export class DeliveryQueryDto {
  @ApiPropertyOptional({ description: 'Search by invoice number, client name, or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: DeliveryStatus })
  @IsOptional()
  @IsEnum(DeliveryStatus)
  status?: DeliveryStatus;

  @ApiPropertyOptional({ description: 'Start date for filtering' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date for filtering' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Filter by reconciliation status' })
  @IsOptional()
  @IsBoolean()
  isReconciled?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}

export class DeliveryFilters {
  @ApiPropertyOptional({ description: 'Search by invoice number, client name, or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: DeliveryStatus })
  @IsOptional()
  @IsEnum(DeliveryStatus)
  status?: DeliveryStatus;

  @ApiPropertyOptional({ description: 'Filter by date range start' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Filter by date range end' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}

export interface GetDeliveriesResponse {
  deliveries: any[];
  total: number;
  page: number;
  totalPages: number;
} 