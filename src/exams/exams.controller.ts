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
import { ExamsService } from './exams.service';
import { CreateMockExamDto } from './dto/create-mock-exam.dto';
import { CreateAssessmentExamDto } from './dto/create-assessnent-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamType } from 'src/shared/enums/exam-type.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/shared/enums/user-role.enum';

@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post('mock')
  @Roles(UserRole.ADMIN)
  async createMockExam(@Body() createExamDto: CreateMockExamDto) {
    return await this.examsService.createMockExam(createExamDto);
  }

  @Post('assessment')
  @Roles(UserRole.ADMIN)
  async createAssessmentExam(@Body() createExamDto: CreateAssessmentExamDto) {
    return await this.examsService.createAssessmentExam(createExamDto);
  }

  @Get('list')
  @Roles(UserRole.PAID_USER)
  async paginateForUser(
    @Query('start') start: string,
    @Query('limit') limit: string,
    @Query('type') _type: '0' | '1',
  ) {
    const type = Number(_type) as ExamType;
    return await this.examsService.paginateWithRelations(type, +start, +limit);
  }

  @Get('search')
  @Roles(UserRole.PAID_USER)
  async search(@Query('query') query: string) {
    return await this.examsService.search(query);
  }

  @Get('summary/:uid')
  @Roles(UserRole.PAID_USER)
  async get(@Param('uid') uid: string) {
    return await this.examsService.getQuestionsSummary(uid);
  }

  @Get('validate-code/:code')
  @Roles(UserRole.ADMIN)
  async validateCode(@Param('code') code: string) {
    return await this.examsService.validateCode(code);
  }

  @Get()
  @Roles(UserRole.PAID_USER)
  async paginate(
    @Query('start') start: string,
    @Query('limit') limit: string,
    @Query('type') _type: '0' | '1',
  ) {
    const type = Number(_type) as ExamType;
    return await this.examsService.paginate(type, +start, +limit);
  }

  @Get(':examId/questions')
  @Roles(UserRole.PAID_USER)
  async loadExamQuestions(@Param('examId') examId: string) {
    // console.log('@@@@', { start, limit, examId });
    return await this.examsService.loadExamQuestions(examId);
  }

  @Get(':uid')
  @Roles(UserRole.PAID_USER)
  async findOneMockExam(@Param('uid') uid: string) {
    return await this.examsService.findOne(uid);
  }

  @Patch(':uid')
  @Roles(UserRole.ADMIN)
  async updateAssessment(
    @Param('uid') uid: string,
    @Body() updateExamDto: UpdateExamDto,
  ) {
    return await this.examsService.updateExam(uid, updateExamDto);
  }

  @Delete(':uid')
  @Roles(UserRole.ADMIN)
  async remove(@Param('uid') uid: string) {
    return await this.examsService.remove(uid);
  }
}
