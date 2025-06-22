import { ValidationPipe, LogLevel } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  // Define log levels based on environment variable
  const logLevels: LogLevel[] = ['error', 'warn', 'log']; // Default to 'info' level (NestJS uses 'log' for info)

  // Only add debug and verbose if LOG_LEVEL allows it
  if (
    process.env.LOG_LEVEL === 'debug' ||
    process.env.LOG_LEVEL === 'verbose'
  ) {
    logLevels.push('debug');
    if (process.env.LOG_LEVEL === 'verbose') {
      logLevels.push('verbose');
    }
  }

  const app = await NestFactory.create(AppModule, {
    logger: logLevels,
  });

  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('The API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on port: ${port}`);

  //TODO rate limiting, security headers, etc.
}
bootstrap();
