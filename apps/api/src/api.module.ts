import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { ResumeModule } from './resume/resume.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ResumeModule, ConfigModule.forRoot({ isGlobal: true })],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
