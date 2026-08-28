import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, UnrecoverableError } from 'bullmq';
import { Resume, Status } from './entities/resume.entity';
import * as storageInterface from '../storage/storage.interface';
import { Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PDFParse } from 'pdf-parse';

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
    let resume: Resume;
    try {
      resume = await this.resumeRepo.findOneByOrFail({
        id: job.data.resumeId,
      });
    } catch (err) {
      Logger.error(`No PDF found ${job.data.resumeId}.`, err);
      throw new UnrecoverableError('Invalid PDF');
    }

    let buffer: Buffer;
    try {
      buffer = await this.storage.read(resume.storageKey);
    } catch (err) {
      Logger.error(`Storage read failed for resume ${resume.id}`, err);
      throw err;
    }

    try {
      const parser = new PDFParse({ data: buffer });
      try {
        const data = await parser.getText();
        resume.rawData = data.text;
      } finally {
        await parser.destroy();
      }
    } catch (err) {
      Logger.error(`Parse failed for resume ${resume.id}`, err);
      throw new UnrecoverableError(
        err instanceof Error ? err.message : 'Invalid PDF',
      );
    }

    resume.status = Status.PARSED;
    await this.resumeRepo.save(resume);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<{ resumeId: string }>) {
    if (!(await job.isFailed())) return; // more retries queued, not terminal yet
    await this.resumeRepo.update(
      { id: job.data.resumeId },
      { status: Status.FAILED },
    );
  }
}
