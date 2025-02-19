import { SetMetadata } from '@nestjs/common';
import { ServiceAction, ServiceName } from '../types/permissions';

export const PERMISSIONS_KEY = 'permissions';

export interface RequiredPermission {
  service: ServiceName;
  action: ServiceAction;
}

export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions); 