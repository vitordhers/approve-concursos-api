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
  SelectorFilter,
  SingleValueFilter,
} from 'src/shared/interfaces/filters.interface';
import { BaseSubject } from 'src/subjects/interfaces/base-subject.interface';
import { CreateAnswerDto } from './dto/create-answer.dto';

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

  async applyFirstFiltersAndPaginateSubjectsSummary(filters: Filters[]) {
    const whereClause = this.dbService.buildWhereConditionFromFilters(filters);
    const query = `SELECT subjectId, COUNT() as total FROM questions ${
      whereClause !== '' ? ' WHERE ' + whereClause : ''
    } GROUP BY subjectId FETCH subjectId`;

    // console.log({ whereClause, query });

    const result = await this.dbService.query<{
      total: number;
      subjectId: BaseSubject;
    }>(query);

    return result.map((r) => ({
      subject: this.serializationService.serializeSubjectResult(r.subjectId),
      total: r.total,
    }));
  }

  async applyFiltersAndPaginateQuestions(
    filters: Filters[],
    selectors: SelectorFilter[],
  ) {
    const whereClause = this.dbService.buildWhereConditionFromFilters(filters);
    const query = `BEGIN TRANSACTION;
    ${selectors
      .map((selector) => {
        const additionalAndClause = filters.length
          ? `AND ${selector.key} = ${selector.value}`
          : `WHERE ${selector.key} = ${selector.value}`;
        const fetchesClause = selector.fetch.join(', ');
        return `SELECT id, institutionId, code, prompt, subjectId, alternatives, answerExplanation, createdAt, updatedAt, illustration, year, boardId, examId, educationStage FROM questions ${
          (whereClause !== '' ? ' WHERE ' + whereClause : '') +
          additionalAndClause
        } LIMIT ${selector.limit} FETCH ${fetchesClause};`;
      })
      .join(';')}
    COMMIT TRANSACTION;`;

    // console.log('@@@@', { query });

    const results = await this.dbService.query(query);

    // console.log('@@@@', { results });

    const serializedResults = results.map((r) =>
      this.serializationService.serializeQuestionResult(r, true),
    );

    // console.log('@@@@', { serializedResults });

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
    const currentTimestamp = Date.now();
    const updatedQuestion: BaseQuestion = {
      prompt,
      illustration,
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
    // if (toBeDeletedInstitution.img) {
    //   await this.uploadService.deleteFile(toBeDeletedInstitution.img);
    // }
    // if (toBeDeletedInstitution.thumb) {
    //   await this.uploadService.deleteFile(toBeDeletedInstitution.thumb);
    // }
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

    // console.log('@@@', { results });
    return results[0];
  }
}
