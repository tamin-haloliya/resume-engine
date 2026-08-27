import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Resume, Status } from './entities/resume.entity';
import * as storageInterface from '../storage/storage.interface';
import { Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { setTimeout } from 'timers/promises';

@Processor('resume-processing')
export class ResumeWorker extends WorkerHost {
  constructor(
    @InjectRepository(Resume) private readonly resumeRepo: Repository<Resume>,
    @Inject(storageInterface.STORAGE_SERVICE)
    private readonly storage: storageInterface.StorageService,
  ) {
    super();
  }
  async process(job: Job<{ resumeId: string }>): Promise<void> {
    const resume = await this.resumeRepo.findOneByOrFail({
      id: job.data.resumeId,
    });
    const buffer = await this.storage.read(resume.storageKey);
    await setTimeout(2000);

    resume.status = Status.PARSED;
    await this.resumeRepo.save(resume);
  }
}
