import { IsString, IsEmail, IsEnum, IsOptional, MinLength, IsArray, ValidateNested, IsBoolean, IsDate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Permission, ServiceName, ServiceAction } from '../types/permissions';

export class PermissionDto implements Permission {
  @ApiProperty({ enum: [
    'users', 'deliveries', 'movements', 'inventory', 'products',
    'categories', 'suppliers', 'customers', 'warehouses',
    'reports', 'settings', 'roles', 'audit-logs'
  ]})
  @IsEnum([
    'users', 'deliveries', 'movements', 'inventory', 'products',
    'categories', 'suppliers', 'customers', 'warehouses',
    'reports', 'settings', 'roles', 'audit-logs'
  ])
  service: ServiceName;

  @ApiProperty({ type: [String], enum: ['create', 'read', 'update', 'delete', 'export', 'import'] })
  @IsArray()
  @IsEnum(['create', 'read', 'update', 'delete', 'export', 'import'], { each: true })
  actions: ServiceAction[];
}

export class CreateUserDto {
  @ApiProperty({ description: 'User full name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'User role', enum: ['admin', 'user'] })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ type: [PermissionDto], description: 'User permissions' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions?: Permission[];
}

export class TrustedDeviceDto {
  @IsString()
  deviceId: string;

  @IsString()
  name: string;

  @IsDate()
  @Type(() => Date)
  lastUsed: Date;

  @IsDate()
  @Type(() => Date)
  createdAt: Date;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'User full name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'User email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'User password', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ description: 'User role', enum: ['admin', 'user'] })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'User status', enum: ['active', 'inactive'] })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;

  @ApiPropertyOptional({ description: 'User two factor enabled' })
  @IsBoolean()
  @IsOptional()
  twoFactorEnabled?: boolean;

  @ApiPropertyOptional({ description: 'User two factor secret' })
  @IsString()
  @IsOptional()
  twoFactorSecret?: string;

  @ApiPropertyOptional({ description: 'User backup codes' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  backupCodes?: string[];

  @ApiPropertyOptional({ type: [TrustedDeviceDto], description: 'User trusted devices' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrustedDeviceDto)
  @IsOptional()
  trustedDevices?: TrustedDeviceDto[];

  @ApiPropertyOptional({ type: [PermissionDto], description: 'User permissions' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions?: Permission[];

  @ApiPropertyOptional({ description: 'Last login timestamp' })
  @IsOptional()
  @Type(() => Date)
  lastLogin?: Date;

  @ApiPropertyOptional({ description: 'Last login IP address' })
  @IsOptional()
  @IsString()
  lastLoginIp?: string;

  @ApiPropertyOptional({ description: 'Last login user agent' })
  @IsOptional()
  @IsString()
  lastLoginUserAgent?: string;
}

export class UserQueryDto {
  @ApiPropertyOptional({ description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by role', enum: ['admin', 'user'] })
  @IsOptional()
  @IsEnum(['admin', 'user'])
  role?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: ['active', 'inactive'] })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  limit?: number = 10;
}

export class Enable2FADto {
  @IsString()
  token: string;
}

export class Verify2FADto {
  @IsString()
  token: string;
}

export class AddTrustedDeviceDto {
  @IsString()
  deviceName: string;
} 