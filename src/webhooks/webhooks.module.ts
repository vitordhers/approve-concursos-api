import { Module } from '@nestjs/common';
import { PaymentsModule } from 'src/payments/payments.module';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [PaymentsModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
