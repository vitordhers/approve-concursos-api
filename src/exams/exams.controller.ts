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
import { ExamsService } from './exams.service';
import { CreateMockExamDto } from './dto/create-mock-exam.dto';
import { CreateAssessmentExamDto } from './dto/create-assessnent-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { AdminToken } from 'src/auth/guards/admin-role.guard';
import { ExamType } from 'src/shared/enums/exam-type.enum';

@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post('mock')
  @UseGuards(AdminToken)
  async createMockExam(@Body() createExamDto: CreateMockExamDto) {
    return await this.examsService.createMockExam(createExamDto);
  }

  @Post('assessment')
  @UseGuards(AdminToken)
  async createAssessmentExam(@Body() createExamDto: CreateAssessmentExamDto) {
    return await this.examsService.createAssessmentExam(createExamDto);
  }

  @Get('validate-code/:code')
  async validateCode(@Param('code') code: string) {
    return await this.examsService.validateCode(code);
  }

  @Get()
  async paginate(
    @Query('start') start: string,
    @Query('limit') limit: string,
    @Query('type') _type: '0' | '1',
  ) {
    const type = Number(_type) as ExamType;
    return await this.examsService.paginate(type, +start, +limit);
  }

  @Get('list')
  async paginateForUser(
    @Query('start') start: string,
    @Query('limit') limit: string,
    @Query('type') _type: '0' | '1',
  ) {
    const type = Number(_type) as ExamType;
    return await this.examsService.paginateWithRelations(type, +start, +limit);
  }

  @Get('summary/:uid')
  async get(@Param('uid') uid: string) {
    return await this.examsService.getQuestionsSummary(uid);
  }

  @Get(':examId/questions')
  async paginateExam(
    @Query('start') start: string,
    @Query('limit') limit: string,
    @Param('examId') examId: string,
  ) {
    // console.log('@@@@', { start, limit, examId });
    return await this.examsService.paginateExamQuestions(
      examId,
      +start,
      +limit,
    );
  }

  @Get(':uid')
  async findOneMockExam(@Param('uid') uid: string) {
    return await this.examsService.findOne(uid);
  }

  @Patch(':uid')
  @UseGuards(AdminToken)
  async updateAssessment(
    @Param('uid') uid: string,
    @Body() updateExamDto: UpdateExamDto,
  ) {
    return await this.examsService.updateExam(uid, updateExamDto);
  }

  @Delete(':uid')
  @UseGuards(AdminToken)
  async remove(@Param('uid') uid: string) {
    return await this.examsService.remove(uid);
  }
}
