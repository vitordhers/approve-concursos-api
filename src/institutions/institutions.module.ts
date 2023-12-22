import { Module } from '@nestjs/common';
import { InstitutionsService } from './institutions.service';
import { InstitutionsController } from './institutions.controller';
import { DbModule } from 'src/db/db.module';
import { UploadModule } from 'src/upload/upload.module';
import { SerializationModule } from 'src/serialization/serialization.module';

@Module({
  imports: [DbModule, UploadModule, SerializationModule],
  controllers: [InstitutionsController],
  providers: [InstitutionsService],
})
export class InstitutionsModule {}
