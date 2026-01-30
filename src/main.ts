import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { EnvKeys } from './common/constants/env-keys.constants';
import { SecurityConstants } from './common/constants/security.constants';
import { NodeEnv } from './common/enums/node-env.enum';
import { MobileShieldGuard } from './common/guards/mobile-shield.guard';
import { SecureLoggingInterceptor } from './common/interceptors/secure-logging.interceptor';
import { securityHeadersConfig } from './config/security-headers.config';
const cookieParser = require('cookie-parser');
const compression = require('compression');

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (process.env[EnvKeys.NODE_ENV] === NodeEnv.PRODUCTION) {
    process.exit(1);
  }
});

async function bootstrap() {
  const isProduction = process.env[EnvKeys.NODE_ENV] === NodeEnv.PRODUCTION;

  const app = await NestFactory.create(AppModule, {
    logger: isProduction
      ? ['error', 'warn']
      : ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || SecurityConstants.DEFAULT_PORT;

  // SEC-06: Production Hardening
  app.use(helmet(securityHeadersConfig));
  app.use(compression()); // Reduce payload size
  app.use(cookieParser());
  app.enableShutdownHooks(); // Graceful shutdown for Prisma and Sockets

  app.setGlobalPrefix('api/v1', {
    exclude: ['/api', '/api/*path', 'favicon.ico'],
  });

  // SEC-06: Global Security Shield for Multi-platform
  // This ensures that only authorized mobile apps or admin panels can access the API.
  app.useGlobalGuards(new MobileShieldGuard(configService));

  const allowedOrigins = configService.get<string>(EnvKeys.ALLOWED_ORIGINS);
  const corsOrigins = allowedOrigins
    ? allowedOrigins.split(',').map((origin) => origin.trim())
    : SecurityConstants.DEFAULT_CORS_ORIGINS;

  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    maxAge: 86400,
  });


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
      .setTitle('Talqah API')
      .setDescription('Talqah API')
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
  }
}

bootstrap();
