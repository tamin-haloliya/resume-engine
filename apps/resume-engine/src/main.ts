import { NestFactory } from '@nestjs/core';
import { ResumeEngineModule } from './resume-engine.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(ResumeEngineModule);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.RESUME_ENGINE_PORT ?? 3000);
}
bootstrap();
