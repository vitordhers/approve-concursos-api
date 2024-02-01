import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { TokensModule } from '../tokens/tokens.module';
import { SerializationModule } from 'src/serialization/serialization.module';
import { EmailsModule } from 'src/email/email.module';
import { KiwifyService } from './kiwify.service';
import { UsersModule } from 'src/users/users.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    DbModule,
    TokensModule,
    SerializationModule,
    EmailsModule,
    UsersModule,
    HttpModule,
  ],
  providers: [KiwifyService],
  exports: [KiwifyService],
})
export class PaymentsModule {}
