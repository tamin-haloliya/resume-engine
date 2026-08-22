import { Module } from '@nestjs/common';
import { DiskStorageService } from './disk-storage/disk-storage.service';
import { STORAGE_SERVICE } from './storage.interface';

@Module({
  providers: [
    {
      provide: STORAGE_SERVICE,
      useClass: DiskStorageService,
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
