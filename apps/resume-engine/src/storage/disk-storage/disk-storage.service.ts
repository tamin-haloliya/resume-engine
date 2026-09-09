import { Injectable } from '@nestjs/common';
import { StorageService } from '../storage.interface';
import path from 'path';
import fs from 'fs/promises';

@Injectable()
export class DiskStorageService implements StorageService {
  private readonly uploadDir = path.resolve(__dirname, '../../../diskStorage');

  async save(file: Express.Multer.File, key: string): Promise<string> {
    const filepath = path.join(this.uploadDir, key);
    await fs.writeFile(filepath, file.buffer);
    return filepath;
  }

  async delete(key: string): Promise<void> {
    await fs.unlink(path.join(this.uploadDir, key));
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getUrl(key: string): Promise<string> {
    return path.join(this.uploadDir, key);
  }

  async read(key: string): Promise<Buffer> {
    const filePath = path.join(this.uploadDir, key);
    return fs.readFile(filePath);
  }
}
