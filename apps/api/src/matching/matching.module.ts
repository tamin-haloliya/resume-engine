import { Module } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { Resume } from '../resume/entities/resume.entity';
import { Job } from '../job/entities/job.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Resume, Job])],
  providers: [MatchingService],
})
export class MatchingModule {}
