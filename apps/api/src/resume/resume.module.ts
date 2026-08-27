import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resume } from './entities/resume.entity';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { StorageModule } from '../storage/storage.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    TypeOrmModule.forFeature([Resume]),
    StorageModule,
    BullModule.registerQueue({
      name: 'resume-processing',
    }),
  ],
  controllers: [ResumeController],
  providers: [ResumeService],
})
export class ResumeModule {}
