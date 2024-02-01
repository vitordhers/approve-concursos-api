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
import { EmailsService } from 'src/email/email.service';
import { RedefinePasswordDto } from './dto/redefine-password.dto';
import { BehaviorSubject } from 'rxjs';
import { SseMessageEvent } from 'src/shared/interfaces/sse-message-event.interface';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class UsersService implements OnModuleInit {
  private logger = new Logger('UsersService');
  private shouldRunMigrations =
    false || this.configService.get<string>('ENVIRONMENT') === 'production';

  private entity = Entity.USERS;

  private redefinePasswordSecret = this.configService.get<string>(
    'PASSWORD_RECOVERY_TOKEN_SECRET',
  );

  private paymentListenerMap = new Map<
    string,
    BehaviorSubject<SseMessageEvent>
  >();

  constructor(
    private readonly dbService: DbService,
    private readonly tokensService: TokenService,
    private readonly configService: ConfigService,
    private readonly serializationService: SerializationService,
    private readonly emailsService: EmailsService,
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

  async findOneByCpf(cpf: string): Promise<BaseUser | undefined> {
    const result = await this.dbService.findOneWhere<BaseUser>(
      this.entity,
      `cpf == '${cpf}'`,
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
      cpf: this.trimCpf(cpf),
      loginProviders: [LoginProvider.EMAIL],
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };

    const newUserResult = await this.create(createUserDto);

    const newUser =
      this.serializationService.serializeUserResult(newUserResult);

    await this.emailsService.sendUserValidationEmail(newUser);
  }

  async create(createUserDto: CreateUserDto) {
    const newUserResult = await this.dbService.create<BaseUser>(this.entity, {
      ...createUserDto,
      role: UserRole.NON_VALIDATED_USER,
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
      cpf: this.trimCpf(cpf),
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
    const user = this.serializationService.serializeUserResult(newUser);
    if (user.role === UserRole.NON_VALIDATED_USER) {
      await this.emailsService.sendUserValidationEmail(user);
    }
    return user;
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

  async getOverallPerformance(userId: string): Promise<{
    count: {
      total: number;
    };
    correct: {
      total: number;
    };
  }> {
    const serializedUserId = this.serializationService.regularUidToSurrealId(
      this.entity,
      userId,
    );

    const query = `BEGIN TRANSACTION;
    SELECT 
    (SELECT COUNT() as total FROM ->answered->questions GROUP ALL) as count,
    (SELECT COUNT(->questions.correctIndex = [answeredAlternativeIndex]) as total FROM ->answered GROUP ALL) as correct
    FROM ONLY ${serializedUserId};
    COMMIT TRANSACTION;`;

    const results = await this.dbService.query<{
      count: { total: number }[];
      correct: { total: number }[];
    }>(query);

    if (!results.length) {
      return { count: { total: 0 }, correct: { total: 0 } };
    }

    const [result] = results;

    return {
      count: { total: result?.count[0]?.total || 0 },
      correct: { total: result?.correct[0]?.total || 0 },
    };
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
    const id = this.serializationService.regularUidToSurrealId(
      this.entity,
      uid,
    );

    const result = await this.dbService.findOneByUid<BaseUser>(this.entity, id);
    if (!result) return;
    const user = this.serializationService.serializeUserResult(result);
    return user;
  }

  async redefinePassword(redefinePasswordDto: RedefinePasswordDto) {
    const { token, password: inputPassword } = redefinePasswordDto;

    const { email } = this.tokensService.decodeToken<{ email: string }>(
      token,
      this.redefinePasswordSecret,
    );

    const baseUser = await this.findOneByEmail(email);

    if (!baseUser) {
      throw new BadRequestException();
    }

    if (baseUser.role === UserRole.ADMIN) {
      throw new UnauthorizedException();
    }

    if (baseUser.role === UserRole.NON_VALIDATED_USER) {
      return { nonValidatedUser: true };
    }

    const user = this.serializationService.serializeUserResult(baseUser);

    const salt = await genSalt();
    const hashedPassword = await hash(inputPassword, salt);
    const password = salt + ':' + hashedPassword;
    const currentTimestamp = new Date().getTime();

    const updatedUserDto: UpdateUserDto = {
      password,
      updatedAt: currentTimestamp,
    };

    await this.update(user.id, updatedUserDto);

    return { nonValidatedUser: false };
  }

  async update(
    uid: string,
    updateUserDto: UpdateUserDto,
    requestingAdmin?: User,
  ) {
    const { password: inputPassword } = updateUserDto;

    if (
      requestingAdmin &&
      uid === requestingAdmin.id &&
      updateUserDto.role !== UserRole.ADMIN
    ) {
      throw new BadRequestException(
        `Admin users can't revoke their own Admin privilege`,
      );
    }

    const id = this.serializationService.regularUidToSurrealId(
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

    if ('cpf' in updateUserDto && updateUserDto.cpf) {
      updateUserDto.cpf = this.trimCpf(updateUserDto.cpf);
    }

    const dto = { ...updateUserDto, updatedAt: currentTimestamp };

    const updatedUser = await this.dbService.update<BaseUser>(this.entity, id, {
      ...dto,
    });

    const user = this.serializationService.serializeUserResult(updatedUser);

    if (user.role === UserRole.NON_VALIDATED_USER) {
      await this.emailsService.sendUserValidationEmail(user);
    }

    return user;
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

  setNewPaymentListener(user: User) {
    const initialMessageEvent: SseMessageEvent = {
      type: 'initial_payload',
      data: { nextDueDate: user.nextDueDate },
    };
    const subject = new BehaviorSubject<SseMessageEvent>(initialMessageEvent);
    const currentTimestamp = Date.now();
    this.paymentListenerMap.set(`${user.id}_${currentTimestamp}`, subject);

    return subject;
  }

  unsubscribeUserFromPaymentListener(userId: string) {
    const keys = Array.from(this.paymentListenerMap.entries());
    console.log({ keys });

    if (!keys.length) return;

    const entriesToUnsubscribe = keys.filter(([key]) => key.includes(userId));

    console.log({ entriesToUnsubscribe });

    if (!entriesToUnsubscribe.length) return;
    entriesToUnsubscribe.forEach(([key, subject]) => {
      const messageEvent: SseMessageEvent = {
        type: 'unsubscribe',
        data: 'refresh_access_token',
      };
      subject.next(messageEvent);
      subject.complete();
      subject.unsubscribe();
      this.paymentListenerMap.delete(key);
    });
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  unsubscribePaymentListeners() {
    const currentTimestamp = Date.now();

    const entries = Array.from(this.paymentListenerMap.entries());
    if (!entries.length) return;

    entries.forEach(([key, subject]) => {
      const timestamp = Number(key.split('_')[1]);
      if (currentTimestamp - 1000 * 60 * 10 < timestamp) return;
      subject.complete();
      subject.unsubscribe();
      this.paymentListenerMap.delete(key);
    });
  }

  private trimCpf(cpf: string) {
    return cpf.replace(/[-.]/g, '');
  }
}
