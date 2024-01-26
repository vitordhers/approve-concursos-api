import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/shared/enums/user-role.enum';

@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() createBoardDto: CreateBoardDto) {
    return await this.boardsService.create(createBoardDto);
  }

  @Get('search')
  @Roles(UserRole.PAID_USER)
  async search(@Query('query') searchInput: string) {
    return await this.boardsService.search(searchInput);
  }

  @Get(':uid')
  @Roles(UserRole.PAID_USER)
  async findOne(@Param('uid') uid: string) {
    return await this.boardsService.findOne(uid);
  }

  @Get()
  @Roles(UserRole.PAID_USER)
  async paginate(@Query('start') start: string, @Query('limit') limit: string) {
    return await this.boardsService.paginate(+start, +limit);
  }

  @Patch(':uid')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('uid') uid: string,
    @Body() updateInstitutionDto: UpdateBoardDto,
  ) {
    return await this.boardsService.update(uid, updateInstitutionDto);
  }

  @Delete(':uid')
  @Roles(UserRole.ADMIN)
  async remove(@Param('uid') uid: string) {
    return await this.boardsService.remove(uid);
  }
}
