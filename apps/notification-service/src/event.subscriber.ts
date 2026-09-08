import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';

interface ResumeMatchEvent {
  resumeId: string;
  topMatch: {
    jobTitle: string;
    score: number;
  };
}

@Injectable()
export class EventSubscriber {
  private readonly logger = new Logger(EventSubscriber.name);

  @RabbitSubscribe({
    exchange: 'resume.events',
    routingKey: 'resume.matched',
    queue: 'notification-sevice.resume.matched',
    queueOptions: {
      durable: true,
      autoDelete: false,
    },
  })
  handleEventMatch(payload: ResumeMatchEvent) {
    console.log('Hey! Reached here.', payload);
  }
}
