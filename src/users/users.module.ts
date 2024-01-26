import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DbModule } from '../db/db.module';
import { TokensModule } from '../tokens/tokens.module';
import { SerializationModule } from 'src/serialization/serialization.module';
import { EmailsModule } from 'src/email/email.module';

@Module({
  imports: [DbModule, TokensModule, SerializationModule, EmailsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
