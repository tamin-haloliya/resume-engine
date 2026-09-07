import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Resume } from '../resume/entities/resume.entity';
import { Repository } from 'typeorm';
import { Job } from '../job/entities/job.entity';
import { calculateMatch } from './utils/calculate-match.util';
import { RankedJobsDto } from './dto/ranked-job.dto';

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(Resume) private readonly resumeRepo: Repository<Resume>,
    @InjectRepository(Job) private readonly jobRepo: Repository<Job>,
  ) {}

  async rankJobForResume(
    resumeId: string,
    page = 1,
    limit = 10,
  ): Promise<RankedJobsDto[]> {
    const resume = await this.resumeRepo.findOneBy({ id: resumeId });

    if (!resume) {
      throw new NotFoundException('Resume not found!');
    }

    const jobs = await this.jobRepo.find({
      skip: (page - 1) * limit,
      take: limit,
    });

    const extractedSkills: string[] = resume.extractedData?.skill ?? [];

    const ranked = jobs.map((job) => {
      const { score, matchedSkills, missingSkills } = calculateMatch(
        job.requiredSkills,
        extractedSkills,
      );

      return {
        jobId: job.id,
        jobTitle: job.title,
        score,
        matchedSkills,
        missingSkills,
      };
    });

    return ranked.sort((a, b) => b.score - a.score);
  }
}
