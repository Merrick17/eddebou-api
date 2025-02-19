import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { BadRequestException } from '@nestjs/common';
import helmet from 'helmet';
import * as compression from 'compression';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    
    // Initialize Socket.IO adapter
    app.useWebSocketAdapter(new IoAdapter(app));
    
    // Security middleware
    app.use(helmet());
    app.use(compression());
    
    // Enable CORS with specific configuration
    const corsOrigins = configService.get<string>('CORS_ORIGINS').split(',');
    app.enableCors({
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      maxAge: 3600,
    });

    // Global interceptor for standardizing responses
    app.useGlobalInterceptors(new TransformInterceptor());

    // Swagger configuration
    const config = new DocumentBuilder()
      .setTitle('Inventory Management API')
      .setDescription('API documentation for the Inventory Management System')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    
    // Global validation pipe with transformation enabled
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
        exceptionFactory: (errors) => {
          console.log('Validation Pipe - Validation Errors:', JSON.stringify(errors, null, 2));
          
          const formattedErrors = errors.map(error => ({
            field: error.property,
            value: error.value,
            constraints: error.constraints,
            children: error.children
          }));

          return new BadRequestException({
            message: 'Validation failed',
            error: 'Bad Request',
            statusCode: 400,
            validationErrors: formattedErrors.map(err => ({
              field: err.field,
              message: Object.values(err.constraints || {}).join(', '),
              value: err.value
            }))
          });
        },
      }),
    );

    // Global exception filter
    app.useGlobalFilters(new HttpExceptionFilter());

    const port = configService.get<number>('PORT', 3500);
    const isDev = configService.get<string>('NODE_ENV') === 'development';
    
    await app.listen(port, isDev ? 'localhost' : '0.0.0.0');
    
    console.log(`Application is running on: ${await app.getUrl()}`);
    console.log(`Swagger documentation available at: ${await app.getUrl()}/api`);
    console.log(`Environment: ${configService.get<string>('NODE_ENV')}`);
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}
bootstrap();
