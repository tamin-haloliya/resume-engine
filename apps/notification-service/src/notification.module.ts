import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { EventSubscriber } from './event.subscriber';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { baseEnvSchema } from '@app/env-validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: baseEnvSchema,
    }),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        exchanges: [{ name: 'resume.events', type: 'topic' }],
        uri: config.get<string>('MQ_URI')!,
      }),
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, EventSubscriber],
})
export class NotificationModule {}
