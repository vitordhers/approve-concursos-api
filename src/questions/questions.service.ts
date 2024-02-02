import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { DbService } from 'src/db/db.service';
import { Entity } from 'src/db/enums/entity.enum';
import { BaseQuestion } from './interfaces/base-question.interface';
import { MIGRATIONS } from 'src/db/constants/migrations.const';
import { inspect } from 'util';
import { MigrationBase } from 'src/db/interfaces/migration.interface';
import { ConfigService } from '@nestjs/config';
import { SerializationService } from 'src/serialization/serialization.service';
import { Relation } from 'src/shared/interfaces/relation.interface';
import { RelationType } from 'src/shared/enums/relation-type.enum';
import {
  Filters,
  MultipleValuesFilter,
  RangeValueFilter,
  SelectorFilter,
  SingleValueFilter,
} from 'src/shared/interfaces/filters.interface';
import { CreateAnswerDto } from './dto/create-answer.dto';
import {
  QuestionFilter,
  QuestionFilterQueryParams,
  QuestionPrefilterQueryParams,
} from 'src/shared/enums/question-filters.enum';
import { FilterType } from 'src/shared/enums/filter-type.enum';
import { EducationStage } from 'src/shared/enums/education-stage.enum';
import { BaseSubject } from 'src/subjects/interfaces/base-subject.interface';
import { AnswerableQuestion } from './entities/question.entity';
import { UploadService } from 'src/upload/upload.service';

@Injectable()
export class QuestionsService implements OnModuleInit {
  private logger = new Logger('QuestionsService');
  private shouldRunMigrations =
    false || this.configService.get<string>('ENVIRONMENT') === 'production';

  private entity = Entity.QUESTIONS;

  private entityRelations: Relation[] = [
    {
      idCol: 'subjectId',
      type: RelationType.VALUE,
      entity: Entity.SUBJECTS,
      alias: 'subject',
    },
    {
      idCol: 'institutionId',
      type: RelationType.VALUE,
      entity: Entity.INSTITUTIONS,
      alias: 'institution',
    },
    {
      idCol: 'boardId',
      type: RelationType.VALUE,
      entity: Entity.BOARDS,
      alias: 'board',
    },
  ];

  constructor(
    private readonly dbService: DbService,
    private readonly configService: ConfigService,
    private readonly serializationService: SerializationService,
    private readonly uploadService: UploadService,
  ) {}

  async onModuleInit() {
    if (!this.shouldRunMigrations) return;
    await this.runMigrations();
  }

  async runMigrations() {
    try {
      const migrations = MIGRATIONS.get(this.entity);
      if (!migrations.length) return;

      for (const migration of migrations) {
        const foundMigration = await this.dbService.findOneWhere(
          'migrations',
          `name = '${migration.name}'`,
        );
        if (foundMigration) continue;
        this.logger.warn(
          `migration ${migration.name} wasn't found in database, running it`,
        );
        const migrationResult = await this.dbService.query(migration.query);
        if (!Array.isArray(migrationResult)) {
          this.logger.error(`migration failed ${inspect({ migration })}`);
          continue;
        }
        this.logger.log(
          `migration ${migration.name} succeeded, saving it to database`,
        );
        const currentTimestamp = Date.now();
        const migrationRecord: MigrationBase = {
          ...migration,
          createdAt: currentTimestamp,
          updatedAt: currentTimestamp,
        };

        const storedMigrationResult = await this.dbService.create(
          'migrations',
          migrationRecord,
        );
        this.logger.log(
          `migration ${migration.name} stored! ${inspect(
            { storedMigrationResult },
            { depth: null },
          )}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `runMigrations error ${inspect({ error }, { depth: null })}`,
      );
    }
  }

  async create({
    code,
    prompt,
    illustration,
    alternatives,
    answerExplanation,
    correctIndex,
    year,
    subjectId,
    institutionId,
    boardId,
    examId,
    educationStage,
  }: CreateQuestionDto) {
    const currentTimestamp = Date.now();
    const newQuestion: BaseQuestion = {
      code,
      prompt,
      illustration,
      alternatives,
      answerExplanation,
      correctIndex,
      year,
      educationStage,
      subjectId: `${Entity.SUBJECTS}:${subjectId}`,
      institutionId: institutionId
        ? `${Entity.INSTITUTIONS}:${institutionId}`
        : undefined,
      boardId: boardId ? `${Entity.BOARDS}:${boardId}` : undefined,
      examId: examId ? `${Entity.EXAMS}:${examId}` : undefined,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    const result = await this.dbService.create<BaseQuestion>(
      this.entity,
      newQuestion,
    );
    return this.serializationService.serializeQuestionResult(result[0]);
  }

  async createBulk(dtos: CreateQuestionDto[]) {
    let query = `BEGIN TRANSACTION;`;

    dtos.forEach((dto) => {
      const currentTimestamp = Date.now();

      query += `CREATE questions SET 
      code = '${dto.code}',
      prompt = '${dto.prompt}',
      correctIndex = ${dto.correctIndex},
      subjectId = '${this.serializationService.regularUidToSurrealId(
        Entity.SUBJECTS,
        dto.subjectId,
      )}',
      alternatives = ${JSON.stringify(dto.alternatives)},
      createdAt = ${currentTimestamp},
      updatedAt = ${currentTimestamp}`;

      if (dto.illustration) {
        query += `, illustration = '${dto.illustration}'`;
      }

      if (dto.answerExplanation) {
        query += `, answerExplanation = '${dto.answerExplanation}'`;
      }

      if (dto.year) {
        query += `, year = ${dto.year}`;
      }

      if (dto.educationStage) {
        query += `, educationStage = ${dto.educationStage}`;
      }

      if (dto.institutionId) {
        query += `, institutionId = '${this.serializationService.regularUidToSurrealId(
          Entity.INSTITUTIONS,
          dto.institutionId,
        )}'`;
      }

      if (dto.boardId) {
        query += `, boardId = '${this.serializationService.regularUidToSurrealId(
          Entity.BOARDS,
          dto.boardId,
        )}'`;
      }

      if (dto.examId) {
        query += `, examId = '${this.serializationService.regularUidToSurrealId(
          Entity.EXAMS,
          dto.examId,
        )}'`;
      }

      query += `;`;
    });
    query += `COMMIT TRANSACTION;`;

    const results = await this.dbService.query<BaseQuestion | BaseQuestion[]>(
      query,
    );

    if (!results || !results.length) {
      throw new BadRequestException();
    }

    const data = results
      .map((r) => (Array.isArray(r) ? r[0] : r))
      .filter((r) => !!r.id)
      .map((r) => this.serializationService.serializeQuestionResult(r));

    return data;
  }

  async selectByIds(ids: string[]) {
    const serializedIds = ids.map((i) =>
      this.serializationService.regularUidToSurrealId(this.entity, i),
    );

    const orClauses = serializedIds.reduce((prev, id) => {
      return [...prev, `id=${id}`];
    }, [] as string[]);
    const query = `SELECT * FROM ${this.entity} WHERE ${orClauses.join(
      ' OR ',
    )} FETCH subjectId, institutionId, boardId, examId;`;
    const results = await this.dbService.query<BaseQuestion>(query);
    const serializedResults = results.map((q) =>
      this.serializationService.serializeAnswerableQuestionResult(q),
    );
    return serializedResults;
  }

  async paginate(startAt: number, limit: number) {
    const results = await this.dbService.paginate<BaseQuestion>(
      this.entity,
      startAt,
      limit,
    );
    const data = results.data.map((i) =>
      this.serializationService.serializeQuestionResult(i),
    );
    return { total: results.total, data };
  }

  private mapQuestionQueryParamFiltersToFilters(
    queryParams: QuestionFilterQueryParams,
  ) {
    const filters: Filters[] = [];
    const fetchConditionsSet = new Set<string>();

    Object.keys(queryParams).forEach((key) => {
      if (key.includes('institution')) {
        fetchConditionsSet.add('institution');
      }
      if (key.includes('board')) {
        fetchConditionsSet.add('board');
      }
      if (key.includes('subject')) {
        fetchConditionsSet.add('subject');
      }
    });

    Object.entries(queryParams).forEach(([key, value]) => {
      switch (key) {
        case QuestionFilter.year: {
          const filter: SingleValueFilter = {
            type: FilterType.SINGLE_VALUE,
            key: 'year',
            value: Number(value),
          };
          return filters.push(filter);
        }
        case QuestionFilter.institutionId: {
          const filter: SingleValueFilter = {
            type: FilterType.SINGLE_VALUE,
            key: 'institutionId',
            value: this.serializationService.regularUidToSurrealId(
              Entity.INSTITUTIONS,
              value,
            ),
          };
          return filters.push(filter);
        }
        case QuestionFilter.educationStage: {
          const filter: SingleValueFilter = {
            type: FilterType.SINGLE_VALUE,
            key: 'educationStage',
            value: Number(value) as EducationStage,
          };
          return filters.push(filter);
        }
        case QuestionFilter.fromTo: {
          const [from, to] = (value as string).split(',').map((v) => Number(v));
          const filter: RangeValueFilter = {
            type: FilterType.RANGE,
            key: 'year',
            from,
            to,
          };
          return filters.push(filter);
        }
        case QuestionFilter.boardIdOR: {
          const values = (value as string).split(',');
          const filter: MultipleValuesFilter = {
            type: FilterType.MULTIPLE_VALUES,
            condition: 'OR',
            key: 'boardId',
            values: values.map((v) =>
              this.serializationService.regularUidToSurrealId(Entity.BOARDS, v),
            ),
          };
          return filters.push(filter);
        }
        case QuestionFilter.subjectIdOR: {
          const values = (value as string).split(',');
          const filter: MultipleValuesFilter = {
            type: FilterType.MULTIPLE_VALUES,
            condition: 'OR',
            key: 'subjectId',
            values: values.map((v) =>
              this.serializationService.regularUidToSurrealId(
                Entity.SUBJECTS,
                v,
              ),
            ),
          };
          return filters.push(filter);
        }
        case QuestionFilter.subjectIdSELECTOR: {
          const values = (value as string).split(',');
          values.forEach((value) => {
            const [limit, val] = (value as string).split('_');
            if (!limit) return;
            const filter: SelectorFilter = {
              type: FilterType.SELECTOR,
              condition: 'OR',
              key: 'subjectId',
              limit: Number(limit),
              value: this.serializationService.regularUidToSurrealId(
                Entity.SUBJECTS,
                val,
              ),
              fetch: [...fetchConditionsSet],
            };
            return filters.push(filter);
          });
        }
        default:
          return;
      }
    });

    return filters;
  }

  async applyFirstFiltersAndPaginateSubjectsSummary(
    prefilterQuery: QuestionPrefilterQueryParams,
  ) {
    const filters = this.mapQuestionQueryParamFiltersToFilters(prefilterQuery);
    const whereClause = this.dbService.buildWhereConditionFromFilters(filters);

    const query = `SELECT subjectId, COUNT() as total FROM questions ${
      whereClause !== '' ? ' WHERE ' + whereClause : ''
    } GROUP BY subjectId FETCH subjectId`;

    console.log({ filters, whereClause, query });

    const result = await this.dbService.query<{
      total: number;
      subjectId: BaseSubject;
    }>(query);

    return result.map((r) => ({
      subject: this.serializationService.serializeSubjectResult(r.subjectId),
      total: r.total,
    }));
  }

  async getQuestionsForFilters(filterQuery: QuestionPrefilterQueryParams) {
    const filters = this.mapQuestionQueryParamFiltersToFilters(filterQuery);
    const whereClause = this.dbService.buildWhereConditionFromFilters(filters);
    const clauses = filters
      .filter((f) => f.type === FilterType.SELECTOR)
      .map((selector: SelectorFilter) => {
        const additionalAndClause = filters.filter(
          (f) => f.type !== FilterType.SELECTOR,
        ).length
          ? `AND ${selector.key} = ${selector.value}`
          : `WHERE ${selector.key} = ${selector.value}`;
        const fetchesClause = selector.fetch.join(', ');
        return `SELECT id, institutionId, code, prompt, subjectId, alternatives, answerExplanation, createdAt, updatedAt, illustration, year, boardId, examId, educationStage FROM questions ${
          (whereClause !== '' ? ' WHERE ' + whereClause : '') +
          additionalAndClause
        } LIMIT ${selector.limit} FETCH ${fetchesClause};`;
      })
      .join(';');
    const query = `BEGIN TRANSACTION;
    ${clauses}
    COMMIT TRANSACTION;`;

    // console.log('@@@', inspect({ filters, clauses, query }, { depth: null }));

    const results = await this.dbService.query(query);

    const questionsResults = results.reduce((prev, result) => {
      if (Array.isArray(result)) {
        return [...prev, ...result];
      }
      [...prev, result];
    }, []);

    const serializedResults = questionsResults.map((r) =>
      this.serializationService.serializeAnswerableQuestionResult(r, true),
    );

    return serializedResults;
  }

  async findRandom(filters: Filters[], limit: number) {
    const results = await this.dbService.findRandom<BaseQuestion>(
      this.entity,
      filters,
      limit,
    );

    if (!results || !results.length) return [];
    const data = results.map((r) =>
      this.serializationService.serializeQuestionResult(r),
    );

    return data;
  }

  findAll() {
    return `This action returns all questions`;
  }

  async validateCode(code: string) {
    const result = await this.findOneWhere(`code = '${code}'`);
    return { valid: !result };
  }

  async countWhere(filter: SingleValueFilter) {
    return await this.dbService.count(this.entity, filter);
  }

  async searchByTerms(terms: string, start: number, limit: number) {
    const query = `
    BEGIN TRANSACTION;
    SELECT COUNT() as total FROM questions WHERE prompt @1@ '${terms}' GROUP ALL;
    SELECT *, search::score(1) AS score FROM questions WHERE prompt @1@ '${terms}' ORDER BY score DESC LIMIT ${limit} START ${start} FETCH subjectId, institutionId, boardId, examId;
    COMMIT TRANSACTION;`;
    const result =
      await this.dbService.query<(BaseQuestion & { total: number })[]>(query);

    const count = result.shift()[0];

    // const result = await this.dbService.search<BaseQuestion>(
    //   this.entity,
    //   ['prompt'],
    //   terms,
    //   start,
    //   limit,
    //   ['subjectId', 'institutionId', 'boardId', 'examId'],
    // );

    if (!result || !result.length) return [];

    const data: AnswerableQuestion[] = [];

    result.forEach((res: BaseQuestion | BaseQuestion[]) => {
      if (Array.isArray(res)) {
        res.forEach((r) => {
          const q = this.serializationService.serializeAnswerableQuestionResult(
            r,
            true,
          );
          data.push(q);
        });
        return;
      }
      const q = this.serializationService.serializeAnswerableQuestionResult(
        res,
        true,
      );
      data.push(q);
    });

    return { total: count.total, data };
  }

  async searchByCode(code: string) {
    const result = await this.dbService.search<BaseQuestion>(
      this.entity,
      'code',
      code,
    );
    if (!result || !result.length) return [];
    const data = result.map((r) =>
      this.serializationService.serializeQuestionResult(r),
    );
    return data;
  }

  async findOneWhere(whereClause: string) {
    return await this.dbService.findOneWhere(this.entity, whereClause);
  }

  async findOne(uid: string, withRelations: boolean) {
    const result = withRelations
      ? await this.dbService.findOneWithRelationsByUid<BaseQuestion>(
          this.entity,
          uid,
          this.entityRelations,
        )
      : await this.dbService.findOneByUid<BaseQuestion>(this.entity, uid);
    if (!result) return;
    const question = this.serializationService.serializeQuestionResult(
      result,
      withRelations,
    );
    return question;
  }

  async update(
    uid: string,
    {
      prompt,
      illustration,
      alternatives,
      answerExplanation,
      correctIndex,
      year,
      subjectId,
      institutionId,
      boardId,
      examId,
      educationStage,
    }: UpdateQuestionDto,
  ) {
    const currentQuestion = await this.findOne(uid, false);
    if (!currentQuestion) {
      throw new BadRequestException(`question with id ${uid} doesn't exist`);
    }

    let updatedIllustration = currentQuestion.illustration;
    if (
      currentQuestion.illustration &&
      currentQuestion.illustration !== illustration
    ) {
      await this.uploadService.deleteFile(currentQuestion.illustration);
      updatedIllustration = illustration;
    }

    const currentTimestamp = Date.now();
    const updatedQuestion: BaseQuestion = {
      prompt,
      illustration: updatedIllustration,
      alternatives,
      answerExplanation,
      correctIndex,
      year,
      educationStage,
      subjectId: subjectId ? `${Entity.SUBJECTS}:${subjectId}` : undefined,
      institutionId: institutionId
        ? `${Entity.INSTITUTIONS}:${institutionId}`
        : undefined,
      boardId: boardId ? `${Entity.BOARDS}:${boardId}` : undefined,
      examId: examId ? `${Entity.EXAMS}:${examId}` : undefined,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    const result = await this.dbService.update<BaseQuestion>(
      this.entity,
      uid,
      updatedQuestion,
    );
    return this.serializationService.serializeQuestionResult(result);
  }

  async remove(uid: string) {
    const toBeDeletedQuestion = await this.findOne(uid, false);
    if (!toBeDeletedQuestion) {
      throw new BadRequestException(`Institution with id ${uid} doesn't exist`);
    }
    if (toBeDeletedQuestion.illustration) {
      await this.uploadService.deleteFile(toBeDeletedQuestion.illustration);
    }

    await this.dbService.delete(this.entity, uid);
  }

  async answerQuestion(userId: string, createAnswerDto: CreateAnswerDto) {
    const { questionId, answeredAlternativeIndex } = createAnswerDto;
    const serializedQuestionId =
      this.serializationService.regularUidToSurrealId(this.entity, questionId);
    const serializedUserId = this.serializationService.regularUidToSurrealId(
      Entity.USERS,
      userId,
    );
    const currentTimestamp = Date.now();
    const query = `RELATE ${serializedUserId}->answered->${serializedQuestionId} SET at = ${currentTimestamp}, answeredAlternativeIndex = ${answeredAlternativeIndex}`;

    const results = await this.dbService.query<{
      answeredAlternativeIndex: number;
      at: number;
      id: string;
      in: string;
      out: string;
    }>(query);

    return results[0];
  }
}
