import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { MINIO_CLIENT } from './minio.provider';
import { Client } from 'minio';

@Injectable()
export class MinioStorageService implements OnModuleInit {
  constructor(@Inject(MINIO_CLIENT) private readonly client: Client) {}

  BUCKET_NAME = 'resumes';

  async onModuleInit() {
    try {
      const exists = await this.client.bucketExists(this.BUCKET_NAME);
      if (!exists) {
        await this.client.makeBucket('my-bucket', 'us-east-1');
      }
      console.log('minio connection established!');
    } catch {
      console.log('minio connection failed');
    }
  }
}
