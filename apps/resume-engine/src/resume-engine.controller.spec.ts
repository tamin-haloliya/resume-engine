import { Test, TestingModule } from '@nestjs/testing';
import { ResumeEngineController } from './resume-engine.controller';
import { ResumeEngineService } from './resume-engine.service';

describe('ResumeEngineController', () => {
  let resumeEngineController: ResumeEngineController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ResumeEngineController],
      providers: [ResumeEngineService],
    }).compile();

    resumeEngineController = app.get<ResumeEngineController>(
      ResumeEngineController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(resumeEngineController.getHello()).toBe('Hello World!');
    });
  });
});
