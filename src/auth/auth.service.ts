import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../services/user.service';
import { LoginDto } from '../dto/auth.dto';
import { CreateUserDto } from '../dto/user.dto';
import { UserDocument } from '../schemas/user.schema';
import { MailerService } from '../services/mailer.service';
import { ConfigService } from '@nestjs/config';
import { TwoFactorService } from '../services/two-factor.service';
import { SessionService } from '../services/session.service';
import { Types } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly twoFactorService: TwoFactorService,
    private readonly sessionService: SessionService,
  ) {}

  private generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '15m', // Short-lived access token
    });

    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d', // Longer-lived refresh token
      }
    );

    return { accessToken, refreshToken };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      await this.userService.incrementFailedLoginAttempts(user._id.toString());
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      throw new UnauthorizedException('Account is temporarily locked');
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await this.userService.resetFailedLoginAttempts(user._id.toString());
    }

    const { accessToken, refreshToken } = this.generateTokens(
      user._id.toString(),
      user.email,
      user.role
    );

    // Create session
    await this.sessionService.createSession(
      user._id.toString(),
      accessToken,
      {
        ip: loginDto.ip || '',
        userAgent: loginDto.userAgent || '',
      },
      refreshToken
    );

    // Update last login
    await this.userService.update(user._id.toString(), {
      lastLogin: new Date(),
      lastLoginIp: loginDto.ip,
      lastLoginUserAgent: loginDto.userAgent,
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      },
      accessToken,
      refreshToken,
    };
  }

  async register(createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    if (!user) {
      throw new UnauthorizedException('Registration failed');
    }
    return this.generateTokens(user._id.toString(), user.email, user.role);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return;
    }

    const resetToken = this.jwtService.sign(
      { sub: user._id.toString(), type: 'password_reset' },
      { expiresIn: '1h' }
    );

    await this.userService.saveResetToken(user._id.toString(), resetToken);
    
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      context: {
        resetLink: `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`,
        name: user.name
      }
    });
  }

  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    try {
      const payload = this.jwtService.verify(resetToken);
      if (payload.type !== 'password_reset') {
        throw new UnauthorizedException('Invalid reset token');
      }

      const user = await this.userService.findById(payload.sub);
      if (!user || user.resetToken !== resetToken) {
        throw new UnauthorizedException('Invalid reset token');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.userService.updatePassword(user._id.toString(), hashedPassword);
      await this.userService.clearResetToken(user._id.toString());

    } catch (error) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }

  async sendVerificationEmail(userId: string): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user || user.isEmailVerified) {
      return;
    }

    const verificationToken = this.jwtService.sign(
      { sub: userId, type: 'email_verification' },
      { expiresIn: '24h' }
    );

    await this.userService.saveVerificationToken(userId, verificationToken);
    
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Verify Your Email',
      template: 'email-verification',
      context: {
        verificationLink: `${this.configService.get('FRONTEND_URL')}/verify-email?token=${verificationToken}`,
        name: user.name
      }
    });
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'email_verification') {
        throw new UnauthorizedException('Invalid verification token');
      }

      const user = await this.userService.findById(payload.sub);
      if (!user || user.verificationToken !== token) {
        throw new UnauthorizedException('Invalid verification token');
      }

      await this.userService.markEmailAsVerified(user._id.toString());
      await this.userService.clearVerificationToken(user._id.toString());

    } catch (error) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Check if refresh token is valid in session store
      const session = await this.sessionService.findByRefreshToken(refreshToken);
      if (!session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verify user still exists and is active
      const user = await this.userService.findById(payload.sub);
      if (!user) {
        await this.sessionService.invalidateSession(session.token);
        throw new UnauthorizedException('User no longer exists');
      }

      if (!user.isActive || user.status === 'inactive') {
        await this.sessionService.invalidateSession(session.token);
        throw new UnauthorizedException('User account is inactive');
      }

      if (user.lockoutUntil && user.lockoutUntil > new Date()) {
        await this.sessionService.invalidateSession(session.token);
        throw new UnauthorizedException('User account is temporarily locked');
      }

      // Generate new tokens with updated user info
      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(
        user._id.toString(),
        user.email,
        user.role
      );

      // Invalidate old session and create new one
      await this.sessionService.invalidateSession(session.token);
      await this.sessionService.createSession(
        user._id.toString(),
        accessToken,
        session.deviceInfo,
        newRefreshToken
      );

      // Log the refresh token usage
      await this.userService.logActivity(user._id.toString(), {
        action: 'token_refresh',
        ip: session.deviceInfo.ip,
        userAgent: session.deviceInfo.userAgent,
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user._id.toString(),
          email: user.email,
          role: user.role
        }
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, accessToken: string) {
    await this.sessionService.invalidateSession(accessToken);
    await this.userService.logActivity(userId, {
      action: 'logout',
      ip: '',
      userAgent: '',
    });
  }

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}