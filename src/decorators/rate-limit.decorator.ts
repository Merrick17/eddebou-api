import { SetMetadata } from '@nestjs/common';

export const RateLimit = (limit: number, windowSeconds: number) => {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    SetMetadata('rateLimit', limit)(target, key, descriptor);
    SetMetadata('rateLimitWindow', windowSeconds)(target, key, descriptor);
    return descriptor;
  };
}; 