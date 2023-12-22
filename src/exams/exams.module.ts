import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { DbModule } from 'src/db/db.module';
import { SerializationModule } from 'src/serialization/serialization.module';
import { QuestionsModule } from 'src/questions/questions.module';

@Module({
  imports: [DbModule, SerializationModule, QuestionsModule],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
