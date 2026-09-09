import { Client } from 'minio';
import { ConfigService } from '@nestjs/config';

export const MINIO_CLIENT = 'MINIO_CLIENT';

export const minioProvider = {
  provide: MINIO_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return new Client({
      endPoint: configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: configService.get<number>('MINIO_PORT', 9000),
      useSSL: configService.get<boolean>('MINIO_USE_SSL', false),
      accessKey: configService.get<string>('MINIO_ACCESS_KEY')!,
      secretKey: configService.get<string>('MINIO_SECRET_KEY')!,
    });
  },
};
