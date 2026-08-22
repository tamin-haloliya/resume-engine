import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { STORAGE_SERVICE } from '../storage/storage.interface';
import type { StorageService } from '../storage/storage.interface';

@Injectable()
export class ResumeService {
  constructor(
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  async save(file: Express.Multer.File): Promise<string> {
    const key = `${randomUUID()}-${file.originalname.trim().toLowerCase()}`;
    await this.storage.save(file, key);
    return key;
  }
}
