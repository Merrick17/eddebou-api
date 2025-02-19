import { IsString, IsEmail, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { PaginationQueryDto } from './common/pagination.dto';

export class CreateSupplierDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  taxId?: string;
}

export class UpdateSupplierDto extends CreateSupplierDto {
  @IsEnum(['active', 'inactive'])
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;
}

export class SupplierQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;
} 