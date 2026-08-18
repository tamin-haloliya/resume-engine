import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { ResumeModule } from './resume/resume.module';

@Module({
  imports: [ResumeModule],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
