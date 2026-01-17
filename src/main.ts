import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import session from 'express-session';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { SecureLoggingInterceptor } from './common/interceptors/secure-logging.interceptor';
import { securityHeadersConfig } from './config/security-headers.config';
const cookieParser = require('cookie-parser');

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule, {
    logger: isProduction
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;

  app.use(helmet(securityHeadersConfig));
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1', {
    exclude: ['/api', '/api/*path'],
  });

  const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS');
  const corsOrigins = allowedOrigins
    ? allowedOrigins.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000', 'http://localhost:4200'];

  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    maxAge: 86400,
  });

  const sessionSecret =
    configService.get<string>('SESSION_SECRET') ||
    (isProduction
      ? (() => {
        throw new Error('SESSION_SECRET is required in production');
      })()
      : 'foodie-admin-secret-key-dev');

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'strict',
      },
    }),
  );

  // Global Exception Filter is registered in AppModule using APP_FILTER
  // app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new SecureLoggingInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: isProduction,
      validationError: {
        target: !isProduction,
        value: !isProduction,
      },
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Foodie Restaurant API')
      .setDescription('Foodie Restaurant API')
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

  await app.listen(port, '0.0.0.0');

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`API Base URL: http://localhost:${port}/api/v1`);
  if (!isProduction) {
    console.log(`Swagger documentation: http://localhost:${port}/api`);
    console.log(`Admin UI: http://localhost:${port}/api/v1/admin`);
  }
}

bootstrap();
