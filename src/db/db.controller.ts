import { Body, Controller, Post } from '@nestjs/common';
import { DbService } from './db.service';
import { QueryDto } from './dto/query.dto';

@Controller('db')
export class DbController {
  constructor(private readonly dbService: DbService) {}

  @Post('query')
  async run(@Body() { query }: QueryDto) {
    return await this.dbService.query(query);
  }
}
