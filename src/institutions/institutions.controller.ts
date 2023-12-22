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
import { InstitutionsService } from './institutions.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { AdminToken } from 'src/auth/guards/admin-role.guard';

@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Post()
  @UseGuards(AdminToken)
  async create(@Body() createInstitutionDto: CreateInstitutionDto) {
    return await this.institutionsService.create(createInstitutionDto);
  }

  @Get('search')
  async search(@Query('query') searchInput: string) {
    return await this.institutionsService.search(searchInput);
  }

  @Get(':uid')
  async findOne(@Param('uid') uid: string) {
    return await this.institutionsService.findOne(uid);
  }

  @Get()
  async paginate(@Query('start') start: string, @Query('limit') limit: string) {
    return await this.institutionsService.paginate(+start, +limit);
  }

  @Patch(':uid')
  @UseGuards(AdminToken)
  async update(
    @Param('uid') uid: string,
    @Body() updateInstitutionDto: UpdateInstitutionDto,
  ) {
    return await this.institutionsService.update(uid, updateInstitutionDto);
  }

  @Delete(':uid')
  @UseGuards(AdminToken)
  async remove(@Param('uid') uid: string) {
    return await this.institutionsService.remove(uid);
  }
}
