import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.message
      : 'Internal server error';

    // Detailed error logging
    console.error('HttpExceptionFilter - Error Details:', {
      error: {
        name: exception.name,
        message: exception.message,
        stack: exception.stack,
        code: exception.code,
        errors: exception.errors,
        response: exception.response
      }
    });

    let errorResponse: ApiResponse<null>;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse() as any;
      
      if (exceptionResponse.errors) {
        // Handle structured validation errors
        errorResponse = {
          success: false,
          error: 'ValidationError',
          message: 'Validation failed',
          validationErrors: exceptionResponse.errors.map((err: any) => 
            `${err.field}: ${err.message}`
          )
        };
      } else if (Array.isArray(exceptionResponse.message)) {
        // Handle class-validator errors
        errorResponse = {
          success: false,
          error: 'ValidationError',
          message: 'Validation failed',
          validationErrors: exceptionResponse.message
        };
      } else {
        // Handle other HTTP exceptions
        errorResponse = {
          success: false,
          error: exception.name,
          message: exceptionResponse.message || message
        };
      }
    } else {
      // Handle other types of errors
      errorResponse = {
        success: false,
        error: exception.name || 'Error',
        message: message
      };
    }

    response
      .status(status)
      .json(errorResponse);
  }
} 