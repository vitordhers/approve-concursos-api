import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { CreateAssessmentExamDto } from './dto/create-assessnent-exam.dto';
import { CreateMockExamDto } from './dto/create-mock-exam.dto';
import { ExamType } from 'src/shared/enums/exam-type.enum';
import { DbService } from 'src/db/db.service';
import { SerializationService } from 'src/serialization/serialization.service';
import { ConfigService } from '@nestjs/config';
import { Entity } from 'src/db/enums/entity.enum';
import { MIGRATIONS } from 'src/db/constants/migrations.const';
import { inspect } from 'util';
import { MigrationBase } from 'src/db/interfaces/migration.interface';
import { BaseExam } from './interfaces/base-exam.interface';
import { QuestionsService } from 'src/questions/questions.service';
import { SingleValueFilter } from 'src/shared/interfaces/filters.interface';
import { FilterType } from 'src/shared/enums/filter-type.enum';
import { UpdateExamDto } from './dto/update-exam.dto';
import { Relation } from 'src/shared/interfaces/relation.interface';
import { RelationType } from 'src/shared/enums/relation-type.enum';

@Injectable()
export class ExamsService implements OnModuleInit {
  private logger = new Logger('ExamsService');
  private shouldRunMigrations =
    false || this.configService.get<string>('ENVIRONMENT') === 'production';

  private listRelations: Relation[] = [
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

  private entity = Entity.EXAMS;

  constructor(
    private readonly configService: ConfigService,
    private readonly dbService: DbService,
    private readonly serializationService: SerializationService,
    private readonly questionsService: QuestionsService,
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

  async createMockExam(createExamDto: CreateMockExamDto) {
    const { code, name, mockQuestions } = createExamDto;
    const randomQuestionsPromises = mockQuestions.map(async (mq) => {
      const filter: SingleValueFilter = {
        type: FilterType.SINGLE_VALUE,
        key: 'subjectId',
        value: mq.subjectId,
      };
      const randomQuestions = await this.questionsService.findRandom(
        [filter],
        mq.times,
      );

      if (randomQuestions.length < mq.times) {
        throw new BadRequestException(
          `Subject Id ${mq.subjectId} has less questions than the demanded random questions size: ${mq.times}`,
        );
      }

      return randomQuestions.map((q) => q.id);
    });
    const promisesResults = await Promise.all(randomQuestionsPromises);
    let questionsIds: string[] = [];

    promisesResults.map((r) => (questionsIds = [...questionsIds, ...r]));
    const currentTimestamp = Date.now();

    const newExam: BaseExam = {
      type: ExamType.ASSESSMENT,
      entityId: Entity.EXAMS,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
      code,
      name,
      questionsIds: questionsIds.map((uid) =>
        this.serializationService.regularUidToSurrealId(Entity.QUESTIONS, uid),
      ),
    };

    const result = await this.dbService.create<BaseExam>(Entity.EXAMS, newExam);

    return this.serializationService.serializeExamResult(result[0]);
  }

  async getQuestionsSummary(uid: string) {
    const query = `SELECT *, (SELECT COUNT() as total, (SELECT name FROM subjectId.*) as subject FROM questionsIds.* GROUP ALL) AS questions FROM ${Entity.EXAMS}:${uid};`;
    return await this.dbService.query<BaseExam>(query);
  }

  async createAssessmentExam(createExamDto: CreateAssessmentExamDto) {
    const { code, name, year, questionsIds, institutionId, boardId } =
      createExamDto;

    const currentTimestamp = Date.now();

    const newExam: BaseExam = {
      type: ExamType.ASSESSMENT,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
      code,
      name,
      year,
      questionsIds: questionsIds.map((uid) =>
        this.serializationService.regularUidToSurrealId(Entity.QUESTIONS, uid),
      ),
      institutionId: this.serializationService.regularUidToSurrealId(
        Entity.INSTITUTIONS,
        institutionId,
      ),
      boardId: this.serializationService.regularUidToSurrealId(
        Entity.BOARDS,
        boardId,
      ),
    };

    const result = await this.dbService.create<BaseExam>(Entity.EXAMS, newExam);

    return this.serializationService.serializeExamResult(result[0]);
  }

  async paginate(type: ExamType, startAt: number, limit: number) {
    const filter: SingleValueFilter = {
      type: FilterType.SINGLE_VALUE,
      key: 'type',
      value: type,
    };

    const results = await this.dbService.paginate<BaseExam>(
      this.entity,
      startAt,
      limit,
      filter,
    );
    const data = results.data.map((i) =>
      this.serializationService.serializeExamResult(i),
    );
    return { total: results.total, data };
  }

  async paginateExamQuestions(examId: string, startAt: number, limit: number) {
    examId = this.serializationService.regularUidToSurrealId(
      Entity.EXAMS,
      examId,
    );
    const query = `SELECT *, 
      (SELECT COUNT() as total  FROM ONLY questionsIds.* GROUP ALL) as count,
      (SELECT * OMIT correctIndex, answerExplanation FROM questionsIds.* LIMIT ${limit} START ${startAt} FETCH boardId, subjectId, institutionId, examId) as questions 
      FROM ONLY ${examId}`;
    const results = await this.dbService.query<
      BaseExam & { count: { total: number } }
    >(query);

    const data = results.map((r) =>
      this.serializationService.serializeExamResult(r, true, true),
    );

    return { total: results[0].count.total, data: data[0] };
  }

  async paginateWithRelations(type: ExamType, startAt: number, limit: number) {
    const filter: SingleValueFilter = {
      type: FilterType.SINGLE_VALUE,
      key: 'type',
      value: type,
    };

    const results = await this.dbService.paginateWithRelations<BaseExam>(
      this.entity,
      startAt,
      limit,
      type === ExamType.ASSESSMENT ? this.listRelations : [],
      filter,
    );
    const data = results.data.map((i) =>
      this.serializationService.serializeExamResult(i, true),
    );
    return { total: results.total, data };
  }

  async validateCode(code: string) {
    const result = await this.findOneWhere(`code = '${code}'`);
    return { valid: !result };
  }

  async findOneWhere(whereClause: string) {
    return await this.dbService.findOneWhere(this.entity, whereClause);
  }

  async findOne(uid: string) {
    const result = await this.dbService.findOneByUid<BaseExam>(
      this.entity,
      uid,
    );
    if (!result) return;
    return this.serializationService.serializeExamResult(result);
  }

  async search(searchedValue: string) {
    const result = await this.dbService.search<BaseExam>(
      this.entity,
      ['name', 'code'],
      searchedValue,
    );
    if (!result || !result.length) return [];
    const data = result.map((r) =>
      this.serializationService.serializeInstitutionResult(r),
    );
    return data;
  }

  async updateExam(uid: string, updateExamDto: UpdateExamDto) {
    const { name, year, questionsIds, institutionId, boardId } = updateExamDto;

    const currentTimestamp = Date.now();

    const updatedExam: Partial<BaseExam> = {
      updatedAt: currentTimestamp,
      name,
      year,
      questionsIds,
      institutionId,
      boardId,
    };

    const result = await this.dbService.update<BaseExam>(
      this.entity,
      uid,
      updatedExam,
    );

    return this.serializationService.serializeExamResult(result[0]);
  }

  async remove(uid: string) {
    const toBeDeletedBoard = await this.findOne(uid);
    if (!toBeDeletedBoard) {
      throw new BadRequestException(`Board with id ${uid} doesn't exist`);
    }

    await this.dbService.delete(this.entity, uid);
  }
}
