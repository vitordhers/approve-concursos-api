import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { SingleValueFilter } from 'src/shared/interfaces/filters.interface';
import { FilterType } from 'src/shared/enums/filter-type.enum';
import { CreateAnswerDto } from './dto/create-answer.dto';
// import { AccessToken } from 'src/auth/guards/jwt.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/shared/enums/user-role.enum';
import {
  QuestionPrefilterQueryParams,
  QuestionFilterQueryParams,
} from 'src/shared/enums/question-filters.enum';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post('answer')
  @Roles(UserRole.PAID_USER)
  async createAnswer(
    @GetUser() user: User,
    @Body() createAnswerDto: CreateAnswerDto,
  ) {
    return await this.questionsService.answerQuestion(user.id, createAnswerDto);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() createQuestionDto: CreateQuestionDto) {
    return await this.questionsService.create(createQuestionDto);
  }

  @Post('bulk')
  @Roles(UserRole.ADMIN)
  async createBulk(@Body() createQuestionDtos: CreateQuestionDto[]) {
    return await this.questionsService.createBulk(createQuestionDtos);
  }

  @Get('validate-code/:code')
  @Roles(UserRole.ADMIN)
  async validateCode(@Param('code') code: string) {
    return await this.questionsService.validateCode(code);
  }

  @Get('search')
  @Roles(UserRole.PAID_USER)
  async search(
    @Query('code') code?: string,
    @Query('terms') terms?: string,
    @Query('start') start?: string,
    @Query('limit') limit?: string,
  ) {
    if (!code && !terms)
      throw new BadRequestException(
        `Code / terms are mandatory when searching for questions`,
      );

    if (code) {
      return await this.questionsService.searchByCode(code);
    }

    if (terms) {
      return await this.questionsService.searchByTerms(terms, +start, +limit);
    }
  }

  @Get('prefilter')
  @Roles(UserRole.PAID_USER)
  async applyFirstFiltersAndPaginateSubjectsSummary(
    @Query() query?: QuestionPrefilterQueryParams,
  ) {
    return await this.questionsService.applyFirstFiltersAndPaginateSubjectsSummary(
      query,
    );
  }

  @Get('filter')
  @Roles(UserRole.PAID_USER)
  async applyFiltersAndPaginateQuestions(
    @Query() query?: QuestionFilterQueryParams,
  ) {
    return await this.questionsService.getQuestionsForFilters(query);
  }

  @Get('count')
  @Roles(UserRole.ADMIN)
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

  @Get('select')
  @Roles(UserRole.PAID_USER)
  async selectQuestionsByIds(@Query('ids') idsStr: string) {
    const ids = idsStr.split(',');
    if (!ids.length) return [];
    return await this.questionsService.selectByIds(ids);
  }

  @Get(':uid')
  @Roles(UserRole.PAID_USER)
  async findOne(
    @Param('uid') uid: string,
    @Query('withRelations') _withRelations: string = 'false',
  ) {
    const withRelations = JSON.parse(_withRelations);
    return await this.questionsService.findOne(uid, withRelations);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async paginate(@Query('start') start: string, @Query('limit') limit: string) {
    return await this.questionsService.paginate(+start, +limit);
  }

  @Patch(':uid')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('uid') uid: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return await this.questionsService.update(uid, updateQuestionDto);
  }

  @Delete(':uid')
  @Roles(UserRole.ADMIN)
  async remove(@Param('uid') uid: string) {
    return await this.questionsService.remove(uid);
  }
}
