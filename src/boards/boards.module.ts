import { Module } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { BoardsController } from './boards.controller';
import { DbModule } from 'src/db/db.module';
import { UploadModule } from 'src/upload/upload.module';
import { SerializationModule } from 'src/serialization/serialization.module';

@Module({
  imports: [DbModule, UploadModule, SerializationModule],
  controllers: [BoardsController],
  providers: [BoardsService],
})
export class BoardsModule {}
