import { Type } from 'class-transformer';
import { IsString, IsNumber, IsDate, IsEnum, IsArray, ValidateNested, Min, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AdditionalTaxDto {
  @ApiProperty({ description: 'Name of the tax' })
  @IsString()
  taxName: string;

  @ApiProperty({ description: 'Tax rate percentage', minimum: 0 })
  @IsNumber()
  @Min(0)
  rate: number;
}

class InvoiceItemDto {
  @ApiProperty({ description: 'ID of the inventory item' })
  @IsString()
  itemId: string;

  @ApiProperty({ description: 'Quantity of items', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Buying price per unit', minimum: 0 })
  @IsNumber()
  @Min(0)
  buyingPrice: number;

  @ApiProperty({ description: 'Tax rate for this item', minimum: 0 })
  @IsNumber()
  @Min(0)
  taxRate: number;
}

export class CreateSupplierInvoiceDto {
  @ApiProperty({ description: 'Invoice reference number' })
  @IsString()
  invoiceRef: string;

  @ApiProperty({ description: 'ID of the supplier' })
  @IsString()
  supplierId: string;

  @ApiProperty({ description: 'Array of items in the invoice' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @ApiProperty({ description: 'VAT rate percentage', minimum: 0 })
  @IsNumber()
  @Min(0)
  vatRate: number;

  @ApiProperty({ description: 'Additional taxes to apply' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalTaxDto)
  additionalTaxes?: AdditionalTaxDto[];

  @ApiProperty({ description: 'Invoice date' })
  @Type(() => Date)
  @IsDate()
  invoiceDate: Date;

  @ApiProperty({ description: 'Due date' })
  @Type(() => Date)
  @IsDate()
  dueDate: Date;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSupplierInvoiceDto {
  @ApiPropertyOptional({ description: 'Invoice status', enum: ['pending', 'paid', 'cancelled'] })
  @IsOptional()
  @IsEnum(['pending', 'paid', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Whether the invoice has been reconciled' })
  @IsOptional()
  @IsBoolean()
  isReconciled?: boolean;

  @ApiPropertyOptional({ description: 'Date of reconciliation' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  reconciledAt?: Date;

  @ApiPropertyOptional({ description: 'User who reconciled the invoice' })
  @IsOptional()
  @IsString()
  reconciledBy?: string;
}

export class SupplierInvoiceQueryDto {
  @ApiPropertyOptional({ description: 'Search by invoice reference' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by supplier ID' })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: ['pending', 'paid', 'cancelled'] })
  @IsOptional()
  @IsEnum(['pending', 'paid', 'cancelled'])
  status?: string;

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