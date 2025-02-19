import { Controller, Get, Post, Delete, UseGuards, Req, Param } from '@nestjs/common';
import { SessionService } from '../services/session.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RateLimit } from '../decorators/rate-limit.decorator';
import { SessionInfo } from '../interfaces/session.interface';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { User } from '../schemas/user.schema';

@ApiTags('sessions')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get('auth/me')
  @RateLimit(20, 60)
  @ApiOperation({ summary: 'Get current authenticated user information' })
  @ApiResponse({
    status: 200,
    description: 'Returns the current user information',
    type: User
  })
  async getCurrentUser(@Req() req): Promise<Partial<User>> {
    const user = await this.sessionService.getUserById(req.user.sub);
    // Exclude sensitive information
    const { 
      password, 
      resetToken, 
      verificationToken, 
      refreshToken, 
      twoFactorSecret, 
      backupCodes,
      ...safeUser 
    } = user.toObject();
    return safeUser;
  }

  @Get()
  @RateLimit(20, 60) // 20 requests per minute
  @ApiOperation({ summary: 'Get all active sessions for the current user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns a list of active sessions',
    schema: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/SessionInfo'
      }
    }
  })
  async getActiveSessions(@Req() req): Promise<SessionInfo[]> {
    return this.sessionService.getUserActiveSessions(req.user.sub);
  }

  @Delete('current')
  @RateLimit(10, 60)
  @ApiOperation({ summary: 'Invalidate the current session' })
  @ApiResponse({ 
    status: 200, 
    description: 'Session invalidated successfully',
    schema: {
      properties: {
        message: { type: 'string' }
      }
    }
  })
  async invalidateCurrentSession(@Req() req): Promise<{ message: string }> {
    await this.sessionService.invalidateSession(req.headers.authorization?.split(' ')[1]);
    return { message: 'Session invalidated successfully' };
  }

  @Delete('all')
  @RateLimit(5, 3600) // 5 requests per hour
  @ApiOperation({ summary: 'Invalidate all sessions for the current user' })
  @ApiResponse({ 
    status: 200, 
    description: 'All sessions invalidated successfully',
    schema: {
      properties: {
        message: { type: 'string' }
      }
    }
  })
  async invalidateAllSessions(@Req() req): Promise<{ message: string }> {
    await this.sessionService.invalidateAllUserSessions(req.user.sub);
    return { message: 'All sessions invalidated successfully' };
  }

  @Delete(':token')
  @RateLimit(10, 60)
  @ApiOperation({ summary: 'Invalidate a specific session by token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Session invalidated successfully or not found',
    schema: {
      properties: {
        message: { type: 'string' }
      }
    }
  })
  async invalidateSpecificSession(@Req() req, @Param('token') token: string): Promise<{ message: string }> {
    const session = await this.sessionService.getSession(token);
    if (session?.userId === req.user.sub) {
      await this.sessionService.invalidateSession(token);
      return { message: 'Session invalidated successfully' };
    }
    return { message: 'Session not found or unauthorized' };
  }
} 