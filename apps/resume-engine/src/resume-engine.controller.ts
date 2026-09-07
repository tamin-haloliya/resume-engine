import { Controller, Get } from '@nestjs/common';
import { ResumeEngineService } from './resume-engine.service';

@Controller()
export class ResumeEngineController {
  constructor(private readonly resumeEngineService: ResumeEngineService) {}

  @Get()
  getHello(): string {
    return this.resumeEngineService.getHello();
  }
}
