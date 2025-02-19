import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      tap(data => {
        // Log detailed information about the response
        if (data && data.success === false) {
          console.error('Transform Interceptor - Error Details:', {
            error: {
              name: data.error,
              message: data.message,
              details: data.details,
              validationErrors: data.validationErrors,
              response: data.response,
              stack: data.stack
            },
            path: context.switchToHttp().getRequest().url,
            method: context.switchToHttp().getRequest().method,
            timestamp: new Date().toISOString()
          });
        }
      }),
      map(data => {
        // If it's already in the expected format, return as is
        if (data && (data.success === true || data.success === false)) {
          return data;
        }
        // Otherwise, transform to standard format
        return {
          success: true,
          data,
          message: 'Operation completed successfully'
        };
      })
    );
  }
} 