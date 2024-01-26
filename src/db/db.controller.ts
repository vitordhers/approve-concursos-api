import { Body, Controller, Post } from '@nestjs/common';
import { DbService } from './db.service';
import { QueryDto } from './dto/query.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('db')
export class DbController {
  constructor(private readonly dbService: DbService) {}

  @Public()
  @Post('query')
  async run(@Body() { query }: QueryDto) {
    return await this.dbService.query(query);
  }
}
