import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: 'Two-factor authentication token' })
  @IsString()
  @IsOptional()
  twoFactorToken?: string;

  @ApiPropertyOptional({ description: 'Client IP address' })
  @IsString()
  @IsOptional()
  ip?: string;

  @ApiPropertyOptional({ description: 'Client user agent' })
  @IsString()
  @IsOptional()
  userAgent?: string;
}

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT authentication token'
  })
  token: string;

  @ApiProperty({
    description: 'User information',
    example: {
      id: '507f1f77bcf86cd799439011',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      permissions: [
        {
          service: 'service1',
          actions: ['action1', 'action2']
        },
        {
          service: 'service2',
          actions: ['action3']
        }
      ]
    }
  })
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
    permissions: {
      service: string;
      actions: string[];
    }[];
  };
} 