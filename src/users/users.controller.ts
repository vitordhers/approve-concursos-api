import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { SignUpEmailDto } from './dto/sign-up-email.dto';
import { AccessToken } from 'src/auth/guards/jwt.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { AdminToken } from 'src/auth/guards/admin-role.guard';
import { CreateUserAdminDto } from './dto/create-user-admin.interface';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() singUpDto: SignUpEmailDto) {
    return await this.usersService.signUpEmail(singUpDto);
  }

  @Post('admin')
  @UseGuards(AdminToken)
  async createByAdmin(@Body() createUserDto: CreateUserAdminDto) {
    return await this.usersService.createByAdmin(createUserDto);
  }

  @Get('admin')
  @UseGuards(AdminToken)
  async paginate(@Query('start') start: string, @Query('limit') limit: string) {
    return await this.usersService.paginate(+start, +limit);
  }

  @Get('data')
  @UseGuards(AccessToken)
  async findOne(@GetUser() user: User) {
    return user;
    // return await this.usersService.findOne(uid);
  }

  @Get('performance')
  @UseGuards(AccessToken)
  async getOverallPerformance(@GetUser() user: User) {
    return await this.usersService.getOverallPerformance(user.id);
  }

  @Get('history')
  @UseGuards(AccessToken)
  async getAnswersHistory(
    @GetUser() user: User,
    @Query('start') start: string,
    @Query('limit') limit: string,
  ) {
    return await this.usersService.getAnswersHistory(user.id, +start, +limit);
  }

  @Patch('admin/:id')
  @UseGuards(AdminToken)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete('admin/:uid')
  @UseGuards(AdminToken)
  async remove(@Param('uid') uid: string) {
    return await this.usersService.remove(uid);
  }
}
