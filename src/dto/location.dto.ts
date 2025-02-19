import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLocationDto {
  @ApiProperty({ description: 'Name of the location' })
  @IsString()
  name: string;

  @ApiProperty({ 
    enum: ['warehouse', 'store', 'distribution_center'],
    description: 'Type of location' 
  })
  @IsEnum(['warehouse', 'store', 'distribution_center'])
  type: string;

  @ApiProperty({ description: 'Physical address of the location' })
  @IsString()
  address: string;

  @ApiProperty({ 
    minimum: 0,
    description: 'Maximum storage capacity' 
  })
  @IsNumber()
  @Min(0)
  capacity: number;

  @ApiPropertyOptional({ description: 'Name of contact person' })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'Contact phone number' })
  @IsOptional()
  @IsString()
  contactPhone?: string;
}

export class UpdateLocationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  capacity?: number;

  @IsOptional()
  @IsEnum(['warehouse', 'store', 'distribution_center'])
  type?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;
}

export class LocationQueryDto {
  @ApiPropertyOptional({ 
    minimum: 1,
    description: 'Page number for pagination' 
  })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ 
    minimum: 1,
    description: 'Number of items per page' 
  })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: 'Search term for name or address' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    enum: ['warehouse', 'store', 'distribution_center'],
    description: 'Filter by location type' 
  })
  @IsOptional()
  @IsEnum(['warehouse', 'store', 'distribution_center'])
  type?: string;
} 