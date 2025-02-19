import { IsString, IsNumber, IsOptional, Min, IsUrl, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from './common/pagination.dto';

export class CreateInventoryItemDto {
  @ApiProperty({ description: 'Name of the item' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'SKU (Stock Keeping Unit)' })
  @IsString()
  sku: string;

  @ApiProperty({ description: 'Description of the item' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Category of the item' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Current stock quantity', minimum: 0 })
  @IsNumber()
  @Min(0)
  currentStock: number;

  @ApiProperty({ description: 'Minimum stock level for alerts', minimum: 0 })
  @IsNumber()
  @Min(0)
  minStock: number;

  @ApiProperty({ description: 'Maximum stock quantity', minimum: 0 })
  @IsNumber()
  @Min(0)
  maxStock: number;

  @ApiProperty({ description: 'Buying price per unit', minimum: 0 })
  @IsNumber()
  @Min(0)
  buyingPrice: number;

  @ApiProperty({ description: 'Selling price per unit', minimum: 0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'ID of the supplier' })
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiPropertyOptional({ description: 'ID of the location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ 
    description: 'URL of the item image',
    example: 'https://example.com/image.jpg'
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  image?: string;

  @ApiProperty({ description: 'Barcode of the item' })
  @IsString()
  barcode: string;

  @ApiProperty({ description: 'Tax rate percentage', minimum: 0 })
  @IsNumber()
  @Min(0)
  taxRate: number;

  @ApiProperty({ description: 'Whether the price is tax inclusive' })
  @IsBoolean()
  taxInclusive: boolean;
}

export class UpdateInventoryItemDto implements Partial<CreateInventoryItemDto> {
  @ApiPropertyOptional({ description: 'Name of the item' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'SKU (Stock Keeping Unit)' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: 'Description of the item' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Category of the item' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Current stock quantity', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentStock?: number;

  @ApiPropertyOptional({ description: 'Minimum stock level for alerts', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional({ description: 'Maximum stock quantity', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxStock?: number;

  @ApiPropertyOptional({ description: 'Buying price per unit', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  buyingPrice?: number;

  @ApiPropertyOptional({ description: 'Selling price per unit', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ description: 'ID of the supplier' })
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiPropertyOptional({ description: 'ID of the location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ 
    description: 'URL of the item image',
    example: 'https://example.com/image.jpg'
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  image?: string;

  @ApiPropertyOptional({ description: 'Barcode of the item' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ description: 'Tax rate percentage', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @ApiPropertyOptional({ description: 'Whether the price is tax inclusive' })
  @IsOptional()
  @IsBoolean()
  taxInclusive?: boolean;
}

export class InventoryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search term for name or SKU' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ 
    enum: ['in_stock', 'low_stock', 'out_of_stock'],
    description: 'Filter by status' 
  })
  @IsOptional()
  @IsString()
  status?: string;
} 