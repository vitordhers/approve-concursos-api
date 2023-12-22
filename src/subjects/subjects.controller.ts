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
import { AdminToken } from 'src/auth/guards/admin-role.guard';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @UseGuards(AdminToken)
  async create(@Body() createSubjectDto: CreateSubjectDto) {
    return await this.subjectsService.create(createSubjectDto);
  }

  @Get('search')
  async search(@Query('query') searchInput: string) {
    return await this.subjectsService.search(searchInput);
  }

  @Get()
  async paginate(@Query('start') start: string, @Query('limit') limit: string) {
    return await this.subjectsService.paginate(+start, +limit);
  }

  @Get(':uid')
  async findOne(@Param('uid') uid: string) {
    return await this.subjectsService.findOne(uid);
  }

  @Patch(':uid')
  @UseGuards(AdminToken)
  async update(
    @Param('uid') uid: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ) {
    return await this.subjectsService.update(uid, updateSubjectDto);
  }

  @Delete(':uid')
  @UseGuards(AdminToken)
  async remove(@Param('uid') uid: string) {
    return await this.subjectsService.remove(uid);
  }
}
