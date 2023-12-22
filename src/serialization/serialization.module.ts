import { Module } from '@nestjs/common';
import { SerializationService } from './serialization.service';

@Module({
  providers: [SerializationService],
  exports: [SerializationService],
})
export class SerializationModule {}
