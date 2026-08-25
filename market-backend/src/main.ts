import { join } from 'node:path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AppConfigService } from './config';
import { GlobalExceptionFilter } from './common/filters';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Self-hosted catalogue images (public/). Served from our own domain so no
  // third-party image host can break the app.
  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/static/',
    maxAge: '7d',
  });

  const configService = app.get(AppConfigService);

  // Enable CORS for admin frontend
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3004', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3004', 'https://fetchmart-nine.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter(configService));

  await app.listen(configService.port);
}
bootstrap();
