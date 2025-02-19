import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user.service';
import * as crypto from 'crypto';
import * as qrcode from 'qrcode';

@Injectable()
export class TwoFactorService {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async generateSecret(userId: string): Promise<{ secret: string; qrCode: string }> {
    const user = await this.userService.findById(userId);
    const secret = authenticator.generateSecret();
    const appName = this.configService.get('APP_NAME', 'YourApp');
    const otpauth = authenticator.keyuri(user.email, appName, secret);
    
    // Generate QR code
    const qrCode = await qrcode.toDataURL(otpauth);
    
    // Generate backup codes
    const backupCodes = Array(8)
      .fill(0)
      .map(() => crypto.randomBytes(4).toString('hex'));

    // Save secret and backup codes
    await this.userService.update(userId, {
      twoFactorSecret: secret,
      backupCodes: backupCodes,
      twoFactorEnabled: false // Will be enabled after verification
    });

    return {
      secret,
      qrCode
    };
  }

  async verifyToken(userId: string, token: string): Promise<boolean> {
    const user = await this.userService.findById(userId);
    
    // Check if it's a backup code
    const backupCodeIndex = user.backupCodes.indexOf(token);
    if (backupCodeIndex !== -1) {
      // Remove used backup code
      user.backupCodes.splice(backupCodeIndex, 1);
      await this.userService.update(userId, { backupCodes: user.backupCodes });
      return true;
    }

    // Verify TOTP
    return authenticator.verify({
      token,
      secret: user.twoFactorSecret
    });
  }

  async enable2FA(userId: string, token: string): Promise<boolean> {
    const isValid = await this.verifyToken(userId, token);
    if (isValid) {
      await this.userService.update(userId, { twoFactorEnabled: true });
      return true;
    }
    return false;
  }

  async disable2FA(userId: string, token: string): Promise<boolean> {
    const isValid = await this.verifyToken(userId, token);
    if (isValid) {
      await this.userService.update(userId, {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: []
      });
      return true;
    }
    return false;
  }

  async addTrustedDevice(userId: string, deviceName: string): Promise<string> {
    const deviceId = crypto.randomBytes(32).toString('hex');
    const device = {
      deviceId,
      name: deviceName,
      lastUsed: new Date(),
      createdAt: new Date()
    };

    const user = await this.userService.findById(userId);
    const trustedDevices = [...(user.trustedDevices || []), device];
    await this.userService.update(userId, { trustedDevices });

    return deviceId;
  }

  async verifyTrustedDevice(userId: string, deviceId: string): Promise<boolean> {
    const user = await this.userService.findById(userId);
    const device = user.trustedDevices?.find(d => d.deviceId === deviceId);
    
    if (device) {
      device.lastUsed = new Date();
      await this.userService.update(userId, { trustedDevices: user.trustedDevices });
      return true;
    }
    
    return false;
  }

  async removeTrustedDevice(userId: string, deviceId: string): Promise<void> {
    const user = await this.userService.findById(userId);
    const trustedDevices = user.trustedDevices?.filter(d => d.deviceId !== deviceId) || [];
    await this.userService.update(userId, { trustedDevices });
  }
} 