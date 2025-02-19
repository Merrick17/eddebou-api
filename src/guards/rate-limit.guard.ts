import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitService } from '../services/rate-limit.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rateLimitService: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const clientIp = request.ip;
    const endpoint = request.route.path;

    // Get rate limit settings from decorator or use defaults
    const rateLimit = this.reflector.get<number>('rateLimit', context.getHandler()) || 100;
    const rateLimitWindow = this.reflector.get<number>('rateLimitWindow', context.getHandler()) || 3600; // 1 hour in seconds

    const key = `${clientIp}:${endpoint}`;
    
    if (this.rateLimitService.isRateLimited(key, rateLimit, rateLimitWindow)) {
      throw new HttpException({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Rate limit exceeded',
        retryAfter: rateLimitWindow
      }, HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
} 