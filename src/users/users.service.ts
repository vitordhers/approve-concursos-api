import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { DbService } from '../db/db.service';
import { Entity } from '../db/enums/entity.enum';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-email.interface';
import { CreateEmailUserDto } from './dto/create-email-user.dto';
import { genSalt, hash } from 'bcryptjs';
import { LoginProvider } from '../shared/enums/login-provider.enum';
import { UserRole } from '../shared/enums/user-role.enum';
import { TokenService } from '../tokens/tokens.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Credentials } from '../auth/interfaces/credentials.interface';
import { SignUpEmailDto } from './dto/sign-up-email.dto';
import { ConfigService } from '@nestjs/config';
import { MIGRATIONS } from 'src/db/constants/migrations.const';
import { inspect } from 'util';
import { MigrationBase } from 'src/db/interfaces/migration.interface';
import { SerializationService } from 'src/serialization/serialization.service';
import { BaseUser } from './interfaces/base-user.interface';
import { BaseQuestion } from 'src/questions/interfaces/base-question.interface';
import { CreateUserAdminDto } from './dto/create-user-admin.interface';

@Injectable()
export class UsersService implements OnModuleInit {
  private logger = new Logger('UsersService');
  private shouldRunMigrations =
    false || this.configService.get<string>('ENVIRONMENT') === 'production';

  private entity = Entity.USERS;

  constructor(
    private readonly dbService: DbService,
    private readonly tokensService: TokenService,
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

  async findOneByEmail(email: string): Promise<BaseUser | undefined> {
    const result = await this.dbService.findOneWhere<BaseUser>(
      this.entity,
      `email == '${email}'`,
    );

    return result;
  }

  generateNewCredentials(user: User) {
    const jwtPayload: JwtPayload = {
      id: user.id,
      name: user.name,
      role: user.role,
    };

    const accessToken = this.tokensService.createAccessToken(jwtPayload);
    const refreshToken = this.tokensService.createRefreshToken(jwtPayload);
    return { accessToken, refreshToken } as Credentials;
  }

  async signUpEmail({
    name,
    email,
    cpf,
    password: inputPassword,
  }: SignUpEmailDto) {
    const previousUser = await this.findOneByEmail(email);
    if (previousUser) {
      throw new BadRequestException(
        `User's already registered via ${previousUser.loginProviders.join(
          ',',
        )}`,
      );
    }
    const salt = await genSalt();
    const hashedPassword = await hash(inputPassword, salt);
    const password = salt + ':' + hashedPassword;
    const currentTimestamp = new Date().getTime();
    const createUserDto: CreateEmailUserDto = {
      name,
      email,
      password,
      cpf,
      loginProviders: [LoginProvider.EMAIL],
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };

    const newUserResult = await this.create(createUserDto);

    const newUser =
      this.serializationService.serializeUserResult(newUserResult);

    return this.generateNewCredentials(newUser);
  }

  async create(createUserDto: CreateUserDto) {
    const newUserResult = await this.dbService.create<BaseUser>(this.entity, {
      ...createUserDto,
      role: UserRole.USER,
    });

    const [newUser] = newUserResult;
    return newUser;
  }

  async createByAdmin(createUserDto: CreateUserAdminDto) {
    const { name, email, password: inputPassword, cpf, role } = createUserDto;
    const previousUser = await this.findOneByEmail(email);

    if (previousUser) {
      throw new UnauthorizedException(`Duplicate record!`);
    }

    const salt = await genSalt();
    const hashedPassword = await hash(inputPassword, salt);
    const password = salt + ':' + hashedPassword;
    const currentTimestamp = new Date().getTime();

    const createUserByAdminDto: CreateUserAdminDto = {
      name,
      email,
      password,
      cpf,
      loginProviders: [LoginProvider.EMAIL],
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
      role,
    };

    const newUserResult = await this.dbService.create<BaseUser>(
      this.entity,
      createUserByAdminDto,
    );

    const [newUser] = newUserResult;
    return this.serializationService.serializeUserResult(newUser);
  }

  async paginate(startAt: number, limit: number) {
    const results = await this.dbService.paginate<BaseUser>(
      this.entity,
      startAt,
      limit,
    );
    const data = results.data.map((i) =>
      this.serializationService.serializeUserResult(i),
    );
    return { total: results.total, data };
  }

  async getOverallPerformance(userId: string) {
    const serializedUserId = this.serializationService.regularUidToSurrealId(
      this.entity,
      userId,
    );

    const query = `BEGIN TRANSACTION;
    SELECT 
    (SELECT COUNT() as total FROM ONLY ->answered->questions GROUP ALL) as count,
    (SELECT COUNT(->questions.correctIndex = [answeredAlternativeIndex]) as total FROM ONLY ->answered GROUP ALL) as correct
    FROM ONLY ${serializedUserId};
    COMMIT TRANSACTION;`;

    // console.log('@@@', { query });

    const results = await this.dbService.query<{
      count: { total: number };
      correct: { total: number };
    }>(query);

    // console.log('@@@', { results });
    return results[0];
  }

  async getAnswersHistory(userId: string, startAt: number, limit: number) {
    const serializedUserId = this.serializationService.regularUidToSurrealId(
      this.entity,
      userId,
    );

    const query = `SELECT 
    (SELECT COUNT() as total FROM ONLY ->answered->questions GROUP ALL) as count,
    (SELECT *, ->questions[0] as question FROM ->answered ORDER BY at DESC LIMIT ${limit} START ${startAt} 
    FETCH question.subjectId, question.institutionId, question.boardId, question.examId) as answers
    FROM ONLY ${serializedUserId};`;

    // console.log('@@@', { query });

    const results = await this.dbService.query<{
      count: { total: number };
      answers: {
        answeredAlternativeIndex: number;
        at: number;
        question: BaseQuestion;
      }[];
    }>(query);

    // console.log('@@@', inspect({ results }, { depth: null }));

    const data = results[0].answers.map((a) => ({
      ...a,
      question: this.serializationService.serializeQuestionResult(
        a.question,
        true,
      ),
    }));

    return { total: results[0].count.total, data };
  }

  async findOne(uid: string) {
    const result = await this.dbService.findOneByUid<BaseUser>(
      this.entity,
      uid,
    );

    if (!result) return;
    const user = this.serializationService.serializeUserResult(result);
    return user;
  }

  async update(uid: string, updateUserDto: UpdateUserDto) {
    const { password: inputPassword } = updateUserDto;

    const surrealId = this.serializationService.regularUidToSurrealId(
      this.entity,
      uid,
    );
    const currentTimestamp = new Date().getTime();

    if (inputPassword) {
      const salt = await genSalt();
      const hashedPassword = await hash(inputPassword, salt);
      const password = salt + ':' + hashedPassword;
      updateUserDto.password = password;
    }

    const dto = { ...updateUserDto, updatedAt: currentTimestamp };

    return this.dbService.update(this.entity, surrealId, { ...dto });
  }

  async remove(uid: string) {
    const surrealId = this.serializationService.regularUidToSurrealId(
      this.entity,
      uid,
    );
    const user = await this.findOne(surrealId);
    if (user.role === UserRole.ADMIN) {
      throw new UnauthorizedException();
    }

    return await this.dbService.delete(this.entity, surrealId);
  }
}
