import { Module } from '@nestjs/common';
import { EmailsService } from './email.service';
import { TokensModule } from 'src/tokens/tokens.module';

@Module({
  imports: [TokensModule],
  controllers: [],
  providers: [EmailsService],
  exports: [EmailsService],
})
export class EmailsModule {}
