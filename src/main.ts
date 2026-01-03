import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import session from 'express-session';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;

  // Set global API prefix
  app.setGlobalPrefix('api/v1');

  // Configure CORS
  app.enableCors({
    origin: '*', // Allow all origins for mobile app compatibility, or restrict to specific domains
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.use(
    session({
      secret: 'foodie-admin-secret-key',
      resave: false,
      saveUninitialized: false,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Foodie Restaurant API')
    .setDescription('The Foodie Restaurant API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`API Base URL: http://localhost:${port}/api/v1`);
  console.log(`Swagger documentation: http://localhost:${port}/api`);
  console.log(`Admin UI: http://localhost:${port}/api/v1/admin`);
}
bootstrap();
