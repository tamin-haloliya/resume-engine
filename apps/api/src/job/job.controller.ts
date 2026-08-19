import { Body, Controller, Post } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { JobService } from './job.service';

@Controller('job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  async createJob(@Body() createJobDto: CreateJobDto) {
    const job = await this.jobService.create(createJobDto);
    return { message: 'New job added', job };
  }
}
