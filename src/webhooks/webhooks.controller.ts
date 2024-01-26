import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { KiwifyService } from 'src/payments/kiwify.service';
import { KiwifyOrderDto } from 'src/payments/kiwify/interfaces/kiwify-order.dto';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly kiwifyService: KiwifyService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('kiwify')
  async handleKiwifyPaymentNotice(
    @Body() orderDto: KiwifyOrderDto,
    @Query('signature') signature: string,
  ) {
    return await this.kiwifyService.handleKiwifyOrder(orderDto, signature);
  }
}
