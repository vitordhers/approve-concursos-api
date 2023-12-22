import { Module } from '@nestjs/common';
import { DbService } from './db.service';
import { DbController } from './db.controller';
import { SerializationModule } from 'src/serialization/serialization.module';

@Module({
  imports: [SerializationModule],
  controllers: [DbController],
  providers: [DbService],
  exports: [DbService],
})
export class DbModule {}
