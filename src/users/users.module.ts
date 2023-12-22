import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DbModule } from '../db/db.module';
import { TokensModule } from '../tokens/tokens.module';
import { SerializationModule } from 'src/serialization/serialization.module';

@Module({
  imports: [DbModule, TokensModule, SerializationModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
