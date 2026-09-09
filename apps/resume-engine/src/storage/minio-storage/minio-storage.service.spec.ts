import { Test, TestingModule } from '@nestjs/testing';
import { MinioStorageService } from './minio-storage.service';

describe('MinioStorageService', () => {
  let service: MinioStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MinioStorageService],
    }).compile();

    service = module.get<MinioStorageService>(MinioStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
