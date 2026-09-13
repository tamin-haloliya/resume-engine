import { Controller, Get } from '@nestjs/common';
import { ResumeEngineService } from './resume-engine.service';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class ResumeEngineController {
  constructor(private readonly resumeEngineService: ResumeEngineService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.resumeEngineService.getHello();
  }
}
