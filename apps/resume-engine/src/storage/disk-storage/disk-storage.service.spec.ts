import { Test, TestingModule } from '@nestjs/testing';
import { DiskStorageService } from './disk-storage.service';

describe('DiskStorageService', () => {
  let service: DiskStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiskStorageService],
    }).compile();

    service = module.get<DiskStorageService>(DiskStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
