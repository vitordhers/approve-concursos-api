import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { UploadModule } from 'src/upload/upload.module';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';
import { SerializationModule } from 'src/serialization/serialization.module';

@Module({
  imports: [DbModule, UploadModule, SerializationModule],
  controllers: [SubjectsController],
  providers: [SubjectsService],
})
export class SubjectsModule {}
