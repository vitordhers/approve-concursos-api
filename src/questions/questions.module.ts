import { Module } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { DbModule } from 'src/db/db.module';
import { SerializationModule } from 'src/serialization/serialization.module';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  imports: [DbModule, SerializationModule, UploadModule],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
