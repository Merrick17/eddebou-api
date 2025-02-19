import { Controller, Post, Body, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { TwoFactorService } from '../services/two-factor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Enable2FADto, Verify2FADto, AddTrustedDeviceDto } from '../dto/user.dto';
import { RateLimit } from '../decorators/rate-limit.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('2fa')
@ApiBearerAuth()
@Controller('2fa')
@UseGuards(JwtAuthGuard)
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  @Post('generate')
  @RateLimit(5, 3600) // 5 requests per hour
  @ApiOperation({ summary: 'Generate 2FA secret for user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns QR code and secret for 2FA setup',
    schema: {
      properties: {
        qrCode: { type: 'string' },
        secret: { type: 'string' }
      }
    }
  })
  async generate(@Req() req) {
    return this.twoFactorService.generateSecret(req.user.sub);
  }

  @Post('enable')
  @RateLimit(5, 3600)
  @ApiOperation({ summary: 'Enable 2FA for user' })
  @ApiResponse({ 
    status: 200, 
    description: '2FA enabled successfully',
    schema: {
      properties: {
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid 2FA token' 
  })
  async enable(@Req() req, @Body() dto: Enable2FADto) {
    const success = await this.twoFactorService.enable2FA(req.user.sub, dto.token);
    if (!success) {
      throw new UnauthorizedException('Invalid 2FA token');
    }
    return { message: '2FA enabled successfully' };
  }

  @Post('disable')
  @RateLimit(5, 3600)
  @ApiOperation({ summary: 'Disable 2FA for user' })
  @ApiResponse({ 
    status: 200, 
    description: '2FA disabled successfully',
    schema: {
      properties: {
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid 2FA token' 
  })
  async disable(@Req() req, @Body() dto: Verify2FADto) {
    const success = await this.twoFactorService.disable2FA(req.user.sub, dto.token);
    if (!success) {
      throw new UnauthorizedException('Invalid 2FA token');
    }
    return { message: '2FA disabled successfully' };
  }

  @Post('verify')
  @RateLimit(10, 60) // 10 attempts per minute
  @ApiOperation({ summary: 'Verify 2FA token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Token verified successfully',
    schema: {
      properties: {
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid 2FA token' 
  })
  async verify(@Req() req, @Body() dto: Verify2FADto) {
    const isValid = await this.twoFactorService.verifyToken(req.user.sub, dto.token);
    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA token');
    }
    return { message: 'Token verified successfully' };
  }

  @Post('trusted-device')
  @RateLimit(10, 3600)
  @ApiOperation({ summary: 'Add a trusted device' })
  @ApiResponse({ 
    status: 200, 
    description: 'Device added successfully',
    schema: {
      properties: {
        deviceId: { type: 'string' }
      }
    }
  })
  async addTrustedDevice(@Req() req, @Body() dto: AddTrustedDeviceDto) {
    const deviceId = await this.twoFactorService.addTrustedDevice(req.user.sub, dto.deviceName);
    return { deviceId };
  }

  @Post('trusted-device/remove')
  @RateLimit(10, 3600)
  @ApiOperation({ summary: 'Remove a trusted device' })
  @ApiResponse({ 
    status: 200, 
    description: 'Device removed successfully',
    schema: {
      properties: {
        message: { type: 'string' }
      }
    }
  })
  async removeTrustedDevice(@Req() req, @Body() { deviceId }: { deviceId: string }) {
    await this.twoFactorService.removeTrustedDevice(req.user.sub, deviceId);
    return { message: 'Device removed successfully' };
  }
} 