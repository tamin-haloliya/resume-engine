import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resume } from './entities/resume.entity';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { StorageModule } from '../storage/storage.module';
import { BullModule } from '@nestjs/bullmq';
import { ResumeWorker } from './resume.worker';
import { ExtractorModule } from '../extractor/extractor.module';
import { rabbitMQModule } from '../config/rabbitmq.config';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Resume]),
    StorageModule,
    ExtractorModule,
    BullModule.registerQueue({
      name: 'resume-processing',
    }),
    rabbitMQModule,
    MatchingModule,
  ],
  controllers: [ResumeController],
  providers: [ResumeService, ResumeWorker],
})
export class ResumeModule {}
