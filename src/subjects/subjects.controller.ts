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
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { UserRole } from 'src/shared/enums/user-role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() createSubjectDto: CreateSubjectDto) {
    return await this.subjectsService.create(createSubjectDto);
  }

  @Get('search')
  @Roles(UserRole.PAID_USER)
  async search(@Query('query') searchInput: string) {
    return await this.subjectsService.search(searchInput);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async paginate(@Query('start') start: string, @Query('limit') limit: string) {
    return await this.subjectsService.paginate(+start, +limit);
  }

  @Get(':uid')
  @Roles(UserRole.PAID_USER)
  async findOne(@Param('uid') uid: string) {
    return await this.subjectsService.findOne(uid);
  }

  @Patch(':uid')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('uid') uid: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ) {
    return await this.subjectsService.update(uid, updateSubjectDto);
  }

  @Delete(':uid')
  @Roles(UserRole.ADMIN)
  async remove(@Param('uid') uid: string) {
    return await this.subjectsService.remove(uid);
  }
}
