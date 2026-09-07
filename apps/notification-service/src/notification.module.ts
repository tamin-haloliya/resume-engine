import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { EventSubscriber } from './event.subscriber';

@Module({
  imports: [
    RabbitMQModule.forRoot({
      exchanges: [{ name: 'resume.events', type: 'topic' }],
      uri: 'amqp://admin:root%40123@localhost:5672',
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, EventSubscriber],
})
export class NotificationModule {}
