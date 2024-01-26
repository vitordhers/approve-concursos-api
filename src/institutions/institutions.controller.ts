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
import { InstitutionsService } from './institutions.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/shared/enums/user-role.enum';

@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() createInstitutionDto: CreateInstitutionDto) {
    return await this.institutionsService.create(createInstitutionDto);
  }

  @Get('search')
  @Roles(UserRole.PAID_USER)
  async search(@Query('query') searchInput: string) {
    return await this.institutionsService.search(searchInput);
  }

  @Get(':uid')
  @Roles(UserRole.PAID_USER)
  async findOne(@Param('uid') uid: string) {
    return await this.institutionsService.findOne(uid);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async paginate(@Query('start') start: string, @Query('limit') limit: string) {
    return await this.institutionsService.paginate(+start, +limit);
  }

  @Patch(':uid')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('uid') uid: string,
    @Body() updateInstitutionDto: UpdateInstitutionDto,
  ) {
    return await this.institutionsService.update(uid, updateInstitutionDto);
  }

  @Delete(':uid')
  @Roles(UserRole.ADMIN)
  async remove(@Param('uid') uid: string) {
    return await this.institutionsService.remove(uid);
  }
}
