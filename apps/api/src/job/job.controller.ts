import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
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

  @Get()
  async findJobs(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const { jobs, total } = await this.jobService.findAll(page, limit);
    return { jobs, total };
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const job = await this.jobService.findById(id);
    return { job };
  }
}
