import { Module } from '@nestjs/common';
import { EnvValidationService } from './env-validation.service';

@Module({
  providers: [EnvValidationService],
  exports: [EnvValidationService],
})
export class EnvValidationModule {}
