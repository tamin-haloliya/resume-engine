import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const rabbitMQModule = RabbitMQModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    uri: config.get<string>('MQ_URI')!,
    exchanges: [{ name: 'resume.events', type: 'topic' }],
  }),
});
