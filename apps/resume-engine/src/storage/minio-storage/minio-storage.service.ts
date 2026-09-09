import {
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { MINIO_CLIENT } from './minio.provider';
import { Client } from 'minio';
import { StorageService } from '../storage.interface';
@Injectable()
export class MinioStorageService implements OnModuleInit, StorageService {
  constructor(@Inject(MINIO_CLIENT) private readonly client: Client) {}

  BUCKET_NAME = 'resumes';

  async onModuleInit() {
    try {
      const exists = await this.client.bucketExists(this.BUCKET_NAME);
      if (!exists) {
        await this.client.makeBucket(this.BUCKET_NAME, 'us-east-1');
      }
      console.log('minio connection established!');
    } catch {
      console.log('minio connection failed');
    }
  }

  async save(file: Express.Multer.File, key: string): Promise<string> {
    await this.client.putObject(this.BUCKET_NAME, key, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });
    return key;
  }

  async getUrl(key: string): Promise<string> {
    try {
      return await this.client.presignedGetObject(this.BUCKET_NAME, key);
    } catch {
      throw new NotFoundException(`File not found: ${key}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      return await this.client.removeObject(this.BUCKET_NAME, key);
    } catch {
      throw new NotFoundException(`File not found: ${key}`);
    }
  }

  async read(key: string): Promise<Buffer> {
    try {
      const stream = await this.client.getObject(this.BUCKET_NAME, key);
      const chunks: Buffer[] = [];
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    } catch {
      throw new NotFoundException(`File not found: ${key}`);
    }
  }
}
