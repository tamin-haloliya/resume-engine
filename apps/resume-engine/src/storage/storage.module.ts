import { Module } from '@nestjs/common';
import { DiskStorageService } from './disk-storage/disk-storage.service';
import { STORAGE_SERVICE } from './storage.interface';
import { ConfigModule } from '@nestjs/config';
import { MinioStorageService } from './minio-storage/minio-storage.service';
import { minioProvider } from './minio-storage/minio.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: STORAGE_SERVICE,
      useClass: DiskStorageService,
    },
    minioProvider,
    MinioStorageService,
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
