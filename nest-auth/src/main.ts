import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe()); // This will enable the validation pipe for all routes

  //the cookie parser is gonna be run as a middleware, so a middleware is a function that runs before the request hits the route handler
  //middleware can do things like logging, get access to the request and response object, modify the request and response object, add properties to the request and response object, authenticate
  //register the cookie parser middleware globally
  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('The API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(4000);
}
bootstrap();
