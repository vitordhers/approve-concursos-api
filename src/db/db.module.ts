import { Module } from '@nestjs/common';
import { DbService } from './db.service';
// import { DbController } from './db.controller'; // ** dev env only **
import { SerializationModule } from 'src/serialization/serialization.module';

@Module({
  imports: [SerializationModule],
  controllers: [], // [DbController] ** dev env only **
  providers: [DbService],
  exports: [DbService],
})
export class DbModule {}
