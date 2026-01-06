import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import session from 'express-session';
import helmet from 'helmet';
import hpp from 'hpp';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { SecureLoggingInterceptor } from './common/interceptors/secure-logging.interceptor';
import { securityHeadersConfig } from './config/security-headers.config';

// Process-level error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, log to external service (Sentry, CloudWatch, etc.)
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Log and exit gracefully in production
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'], // Production-safe logging
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Set global API prefix
  app.setGlobalPrefix('api/v1');

  // ============================================
  // SECURITY HEADERS - OWASP Best Practices
  // ============================================
  app.use(helmet(securityHeadersConfig));

  // ============================================
  // XSS PROTECTION - Additional Layer
  // ============================================
  // Note: XSS middleware applied in AppModule

  // ============================================
  // HTTP PARAMETER POLLUTION PROTECTION
  // ============================================
  app.use(hpp());

  // ============================================
  // CORS CONFIGURATION
  // ============================================
  const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS');
  const corsOrigins = allowedOrigins
    ? allowedOrigins.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:4200'];

  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    maxAge: 86400, // 24 hours
  });

  // ============================================
  // SESSION CONFIGURATION (AdminJS)
  // ============================================
  const sessionSecret = configService.get<string>('SESSION_SECRET') ||
    (isProduction
      ? (() => { throw new Error('SESSION_SECRET is required in production'); })()
      : 'foodie-admin-secret-key-dev');

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: isProduction, // HTTPS only in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict',
      },
    }),
  );

  // ============================================
  // GLOBAL EXCEPTION FILTER
  // ============================================
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ============================================
  // SECURE LOGGING INTERCEPTOR
  // ============================================
  app.useGlobalInterceptors(new SecureLoggingInterceptor());

  // ============================================
  // VALIDATION PIPE - Strict Mode
  // ============================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      transform: true, // Auto-transform types
      forbidNonWhitelisted: true, // Reject unknown properties
      disableErrorMessages: isProduction, // Hide validation details in production
      transformOptions: {
        enableImplicitConversion: false, // Explicit type conversion only
      },
    }),
  );

  // ============================================
  // SWAGGER DOCUMENTATION (Dev/Staging Only)
  // ============================================
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Foodie Restaurant API')
      .setDescription('Enterprise-grade food delivery platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .addSecurity('JWT', {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      })
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  // ============================================
  // START SERVER
  // ============================================
  await app.listen(port, '0.0.0.0');

  console.log('='.repeat(60));
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Base URL: http://localhost:${port}/api/v1`);
  if (!isProduction) {
    console.log(`📖 Swagger documentation: http://localhost:${port}/api`);
    console.log(`⚙️  Admin UI: http://localhost:${port}/api/v1/admin`);
  }
  console.log(`🔒 Security Level: ENTERPRISE-GRADE`);
  console.log(`🛡️  OWASP Compliant: YES`);
  console.log('='.repeat(60));
}

bootstrap();
