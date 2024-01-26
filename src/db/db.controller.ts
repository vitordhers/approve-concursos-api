import { Body, Controller, Post } from '@nestjs/common';
import { DbService } from './db.service';
import { QueryDto } from './dto/query.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';

@Controller('db')
export class DbController {
  constructor(
    private readonly dbService: DbService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('query')
  async run(@Body() { query }: QueryDto) {
    if (this.configService.get<string>('ENVIRONMENT') !== 'dev') return;
    return await this.dbService.query(query);
  }
}
