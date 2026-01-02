import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as express from 'express';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';

// Import shared utilities
import {
  HttpExceptionFilter,
  PrismaExceptionFilter,
  AllExceptionsFilter,
  TimingInterceptor,
  CustomValidationPipe,
} from './common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Enable rawBody for Stripe webhook signature verification
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  const configService = app.get(ConfigService);

  // Use body-parser with rawBody verification function to capture raw body
  // This is required for Stripe webhook signature verification
  app.use(express.json({
    limit: '50mb',
    verify: (req: Request & { rawBody?: Buffer }, _res: Response, buf: Buffer) => {
      req.rawBody = buf;
    },
  }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Simple cookie parser middleware
  app.use((req: any, _res: any, next: any) => {
    req.cookies = {};
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      cookieHeader.split(';').forEach((cookie: string) => {
        const [name, ...rest] = cookie.split('=');
        req.cookies[name.trim()] = decodeURIComponent(rest.join('='));
      });
      // Log if auth_token cookie is present
      if (req.cookies['auth_token']) {
        console.log('[Cookie Parser] Found auth_token cookie');
      }
    }
    next();
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // ============================================
  // GLOBAL EXCEPTION FILTERS (order matters: most specific first)
  // ============================================
  app.useGlobalFilters(
    new AllExceptionsFilter(),       // Fallback for unhandled exceptions
    new PrismaExceptionFilter(),     // Database errors with Dutch messages
    new HttpExceptionFilter(),       // HTTP exceptions with consistent format
  );

  // ============================================
  // GLOBAL INTERCEPTORS
  // ============================================
  const isDev = configService.get<string>('NODE_ENV') !== 'production';
  if (isDev) {
    app.useGlobalInterceptors(new TimingInterceptor());
    logger.log('⏱️ Request timing interceptor enabled (dev mode)');
  }

  // ============================================
  // GLOBAL VALIDATION PIPE (with Dutch error messages)
  // ============================================
  app.useGlobalPipes(new CustomValidationPipe());
  logger.log('✅ Custom validation pipe with Dutch messages enabled');


  // CORS - supports multiple origins separated by comma
  const corsOriginEnv = configService.get<string>('CORS_ORIGIN', 'http://localhost:3000');
  const corsOrigins = corsOriginEnv.split(',').map(origin => origin.trim().replace(/\/$/, '')); // Remove trailing slashes
  console.log('🔒 CORS allowed origins:', corsOrigins);
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);

      // Normalize the incoming origin (remove trailing slash)
      const normalizedOrigin = origin.replace(/\/$/, '');

      // Check if origin is in the allowed list
      if (corsOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      // Also allow blob: URLs (for PDF viewing in new tabs)
      if (normalizedOrigin.startsWith('blob:')) {
        return callback(null, true);
      }

      // Log rejected origins for debugging
      console.warn(`⚠️ CORS rejected origin: ${origin} (normalized: ${normalizedOrigin})`);
      console.warn(`   Allowed origins: ${corsOrigins.join(', ')}`);

      // Reject others
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Mobile Shop API')
    .setDescription('API for Mobile Device Shop - Phones, Parts, Repairs')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Products', 'Product management')
    .addTag('Categories', 'Category management')
    .addTag('Orders', 'Order management')
    .addTag('Repairs', 'Repair service management')
    .addTag('Storage', 'File upload management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Start server
  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📚 API Docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
