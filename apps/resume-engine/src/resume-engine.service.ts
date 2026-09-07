import { Injectable } from '@nestjs/common';

@Injectable()
export class ResumeEngineService {
  getHello(): string {
    return 'Hello World!';
  }
}
