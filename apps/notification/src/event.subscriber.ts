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
    exchange: 'resume.event',
    routingKey: 'resume.matched',
    queue: 'notification-sevice.resume.matched',
  })
  handleEventMatch(payload: ResumeMatchEvent) {
    console.log('Notification recieved: ', payload);
  }
}
