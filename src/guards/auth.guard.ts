import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ServiceAction, ServiceName } from '../types/permissions';
import { User } from '../schemas/user.schema';
import { PERMISSIONS_KEY, RequiredPermission } from '../decorators/require-permissions.decorator';

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
    if (isPublic) {
      return true;
    }

    // Check JWT authentication
    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      return false;
    }

    const requiredPermissions = this.reflector.get<RequiredPermission[]>(
      PERMISSIONS_KEY,
      context.getHandler(),
    ) || [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as User;

    // Admin role bypasses permission checks
    if (user.role === 'admin') {
      return true;
    }

    return this.matchPermissions(user, requiredPermissions);
  }

  private matchPermissions(user: User, required: RequiredPermission[]): boolean {
    return required.every(({ service, action }) => {
      const userPermission = user.permissions?.find(p => p.service === service);
      return userPermission?.actions.includes(action);
    });
  }
} 