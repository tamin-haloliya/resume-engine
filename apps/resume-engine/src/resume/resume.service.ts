import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { STORAGE_SERVICE } from '../storage/storage.interface';
import type { StorageService } from '../storage/storage.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Resume, Status } from './entities/resume.entity';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ResumeService {
  constructor(
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
    @InjectRepository(Resume) private readonly resumeRepo: Repository<Resume>,
    @InjectQueue('resume-processing') private readonly resumeQueue: Queue,
  ) {}

  async save(
    file: Express.Multer.File,
  ): Promise<{ id: string; status: Status }> {
    const key = `${randomUUID()}-${file.originalname.trim().toLowerCase()}`;
    await this.storage.save(file, key);

    const resume = await this.resumeRepo.save({
      storageKey: key,
      originalFilename: file.originalname,
      status: Status.PENDING,
    });

    try {
      await this.resumeQueue.add(
        'parse-resume',
        { resumeId: resume.id },
        { attempts: 3, delay: 1000 },
      );
    } catch {
      await this.resumeRepo.update(resume.id, { status: Status.FAILED });
      throw new ServiceUnavailableException(
        'Could not queue resume for processing',
      );
    }
    return { id: resume.id, status: resume.status };
  }

  async get(id: string): Promise<Resume | null> {
    return await this.resumeRepo.findOneBy({ id });
  }
}
