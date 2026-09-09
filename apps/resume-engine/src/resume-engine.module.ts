import { Module } from '@nestjs/common';
import { ResumeEngineController } from './resume-engine.controller';
import { ResumeEngineService } from './resume-engine.service';
import { ResumeModule } from './resume/resume.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobModule } from './job/job.module';
import Joi from 'joi';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionFilter } from './common/filters/all-exception.filter';
import { StorageModule } from './storage/storage.module';
import { DataSource } from 'typeorm';
import { RedisModule } from './redis/redis.module';
import { BullModule } from '@nestjs/bullmq';
import { ExtractorModule } from './extractor/extractor.module';
import { MatchingModule } from './matching/matching.module';
import { rabbitMQModule } from './config/rabbitmq.config';
import { baseEnvSchema } from '@app/env-validation';

const resumeEngineEnvSchema = baseEnvSchema.concat(
  Joi.object({
    DATABASE_HOST: Joi.string().required(),
    DATABASE_PORT: Joi.number().port().default(5432),
    DATABASE_USER: Joi.string().required(),
    DATABASE_PASSWORD: Joi.string().required(),
    INIT_DB: Joi.string().required(),

    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().port().default(6379),

    MINIO_ENDPOINT: Joi.string().required(),
    MINIO_PORT: Joi.number().default(9000),
    MINIO_USE_SSL: Joi.boolean().default(false),
    MINIO_ACCESS_KEY: Joi.string().required(),
    MINIO_SECRET_KEY: Joi.string().required(),
  }),
);

@Module({
  imports: [
    ResumeModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: resumeEngineEnvSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DATABASE_HOST'),
        port: config.get<number>('DATABASE_PORT'),
        username: config.get<string>('DATABASE_USER'),
        password: config.get<string>('DATABASE_PASSWORD'),
        database: config.get<string>('INIT_DB'),
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') === 'development',
      }),
      dataSourceFactory: async (options) => {
        const dataSource = await new DataSource(options!).initialize();
        console.log('db connection established!');
        return dataSource;
      },
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
        },
      }),
    }),
    JobModule,
    StorageModule,
    RedisModule,
    ExtractorModule,
    MatchingModule,
    rabbitMQModule,
  ],
  controllers: [ResumeEngineController],
  providers: [
    ResumeEngineService,
    { provide: APP_FILTER, useClass: AllExceptionFilter },
  ],
})
export class ResumeEngineModule {}
