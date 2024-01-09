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
  BadRequestException,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { AdminToken } from 'src/auth/guards/admin-role.guard';
import {
  Filters,
  SelectorFilter,
  SingleValueFilter,
} from 'src/shared/interfaces/filters.interface';
import { FilterType } from 'src/shared/enums/filter-type.enum';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { AccessToken } from 'src/auth/guards/jwt.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post('answer')
  @UseGuards(AccessToken)
  async createAnswer(
    @GetUser() user: User,
    @Body() createAnswerDto: CreateAnswerDto,
  ) {
    return await this.questionsService.answerQuestion(user.id, createAnswerDto);
  }

  @UseGuards(AdminToken)
  @Post()
  async create(@Body() createQuestionDto: CreateQuestionDto) {
    return await this.questionsService.create(createQuestionDto);
  }

  @UseGuards(AdminToken)
  @Post('bulk')
  async createBulk(@Body() createQuestionDtos: CreateQuestionDto[]) {
    return await this.questionsService.createBulk(createQuestionDtos);
  }

  @Get('validate-code/:code')
  async validateCode(@Param('code') code: string) {
    return await this.questionsService.validateCode(code);
  }

  @Get('search')
  async search(@Query('code') code?: string) {
    if (!code)
      throw new BadRequestException(
        `Code is mandatory when searching for questions`,
      );
    return await this.questionsService.searchByCode(code);
  }

  @Get('prefilter')
  async applyFirstFiltersAndPaginateSubjectsSummary(
    @Query('filters') filters?: string,
  ) {
    const parsedFilters = filters
      ? (JSON.parse(decodeURIComponent(filters)) as Filters[])
      : [];

    return await this.questionsService.applyFirstFiltersAndPaginateSubjectsSummary(
      parsedFilters,
    );
  }

  @Get('filter')
  async applyFiltersAndPaginateQuestions(
    @Query('filters') filters?: string,
    @Query('selectors') selectors?: string,
  ) {
    const parsedFilters = filters
      ? (JSON.parse(decodeURIComponent(filters)) as Filters[])
      : [];

    const parsedSelectors = selectors
      ? (JSON.parse(decodeURIComponent(selectors)) as SelectorFilter[])
      : [];

    return await this.questionsService.applyFiltersAndPaginateQuestions(
      parsedFilters,
      parsedSelectors,
    );
  }

  @Get('count')
  async count(@Query('key') key?: string, @Query('value') value?: string) {
    if (!key || !value)
      throw new BadRequestException(
        `Key and value are mandatory when counting questions`,
      );
    const filter: SingleValueFilter = {
      type: FilterType.SINGLE_VALUE,
      key,
      value,
    };
    return await this.questionsService.countWhere(filter);
  }

  @Get(':uid')
  async findOne(
    @Param('uid') uid: string,
    @Query('withRelations') _withRelations: string,
  ) {
    const withRelations = JSON.parse(_withRelations);
    return await this.questionsService.findOne(uid, withRelations);
  }

  @Get()
  async paginate(@Query('start') start: string, @Query('limit') limit: string) {
    return await this.questionsService.paginate(+start, +limit);
  }

  @UseGuards(AdminToken)
  @Patch(':uid')
  async update(
    @Param('uid') uid: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return await this.questionsService.update(uid, updateQuestionDto);
  }

  @UseGuards(AdminToken)
  @Delete(':uid')
  async remove(@Param('uid') uid: string) {
    return await this.questionsService.remove(uid);
  }
}
