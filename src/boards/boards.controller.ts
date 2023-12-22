import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { AdminToken } from 'src/auth/guards/admin-role.guard';

@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  @UseGuards(AdminToken)
  async create(@Body() createBoardDto: CreateBoardDto) {
    return await this.boardsService.create(createBoardDto);
  }

  @Get('search')
  async search(@Query('query') searchInput: string) {
    return await this.boardsService.search(searchInput);
  }

  @Get(':uid')
  async findOne(@Param('uid') uid: string) {
    return await this.boardsService.findOne(uid);
  }

  @Get()
  async paginate(@Query('start') start: string, @Query('limit') limit: string) {
    return await this.boardsService.paginate(+start, +limit);
  }

  @Patch(':uid')
  @UseGuards(AdminToken)
  async update(
    @Param('uid') uid: string,
    @Body() updateInstitutionDto: UpdateBoardDto,
  ) {
    return await this.boardsService.update(uid, updateInstitutionDto);
  }

  @Delete(':uid')
  @UseGuards(AdminToken)
  async remove(@Param('uid') uid: string) {
    return await this.boardsService.remove(uid);
  }
}
