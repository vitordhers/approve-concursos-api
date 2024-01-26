import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  Query,
  Sse,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { SignUpEmailDto } from './dto/sign-up-email.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { CreateUserAdminDto } from './dto/create-user-admin.interface';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/shared/enums/user-role.enum';
import { Public } from 'src/auth/decorators/public.decorator';
import { RedefinePasswordDto } from './dto/redefine-password.dto';
import { Observable } from 'rxjs';
import { SseMessageEvent } from 'src/shared/interfaces/sse-message-event.interface';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Sse('payments')
  @Roles(UserRole.VALIDATED_USER)
  servePaymentsSse(@GetUser() user: User): Observable<SseMessageEvent> {
    return this.usersService.setNewPaymentListener(user);
  }

  @Post()
  @Public()
  async create(@Body() singUpDto: SignUpEmailDto) {
    return await this.usersService.signUpEmail(singUpDto);
  }

  @Post('admin')
  @Roles(UserRole.ADMIN)
  async createByAdmin(@Body() createUserDto: CreateUserAdminDto) {
    return await this.usersService.createByAdmin(createUserDto);
  }

  @Get('admin')
  @Roles(UserRole.ADMIN)
  async paginate(@Query('start') start: string, @Query('limit') limit: string) {
    return await this.usersService.paginate(+start, +limit);
  }

  @Get('admin/:uid')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('uid') uid: string) {
    return await this.usersService.findOne(uid);
  }

  @Get('data')
  @Roles(UserRole.VALIDATED_USER)
  async getUserData(@GetUser() user: User) {
    return user;
    // return await this.usersService.findOne(uid);
  }

  @Get('performance')
  @Roles(UserRole.VALIDATED_USER)
  async getOverallPerformance(@GetUser() user: User) {
    return await this.usersService.getOverallPerformance(user.id);
  }

  @Get('history')
  @Roles(UserRole.PAID_USER)
  async getAnswersHistory(
    @GetUser() user: User,
    @Query('start') start: string,
    @Query('limit') limit: string,
  ) {
    return await this.usersService.getAnswersHistory(user.id, +start, +limit);
  }

  @Patch('admin/:id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() user: User,
  ) {
    return await this.usersService.update(id, updateUserDto, user);
  }

  @Patch('redefine')
  @Public()
  async redefinePassword(@Body() redefinePasswordDto: RedefinePasswordDto) {
    return await this.usersService.redefinePassword(redefinePasswordDto);
  }

  @Delete('admin/:uid')
  @Roles(UserRole.ADMIN)
  async remove(@Param('uid') uid: string) {
    return await this.usersService.remove(uid);
  }
}
