import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcryptjs';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom, map, of } from 'rxjs';
// import { v4 as uuid } from 'uuid';
import { SignInDto } from './dto/signin.dto';
import { TokenService } from '../tokens/tokens.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User } from 'src/users/entities/user.entity';
import { SerializationService } from 'src/serialization/serialization.service';
import { RecoverPasswordDto } from './dto/recover-password.dto';
import { UserRole } from 'src/shared/enums/user-role.enum';
import { EmailsService } from 'src/email/email.service';
import { ResendConfirmationEmailDto } from './dto/resend-validation-email.dto';
import { VerifyUserDto } from './dto/verify-user.dto';
import { inspect } from 'util';

@Injectable()
export class AuthService {
  private logger = new Logger('AuthService');
  private verifyUserSecret = this.configService.get<string>(
    'MAIL_REQUESTS_TOKEN_SECRET',
  );

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly tokenService: TokenService,
    private readonly serializationService: SerializationService,
    private readonly emailsService: EmailsService,
  ) {}

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new BadRequestException();
    }

    const { id, role } = user;

    if (role === UserRole.NON_VALIDATED_USER) {
      return { nonValidatedUser: true };
    }
    const jwtPayload: JwtPayload = { id, role };
    return await this.tokenService.getCredentials(jwtPayload, true);
  }

  async validateUser(email: string, password: string): Promise<User> {
    const baseUser = await this.usersService.findOneByEmail(email);
    if (!baseUser || !baseUser.password) {
      throw new UnauthorizedException();
    }
    const [salt, dbpassword] = baseUser.password.split(':');
    const hashedPassword = await hash(password, salt);
    if (dbpassword !== hashedPassword) {
      throw new UnauthorizedException();
    }
    delete baseUser.password;
    return this.serializationService.serializeUserResult(baseUser);
  }

  async refreshAccessToken(payload: JwtPayload) {
    return this.tokenService.createAccessToken(payload);
  }

  async googleRecaptchaCheck(response: string): Promise<boolean> {
    try {
      const secret_key = this.configService.get<string>(
        'GOOGLE_RECAPTCHA_SECRET',
      );
      const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret_key}&response=${response}`;
      const $src = this.httpService.post(url).pipe(
        map((r) => {
          if ('error-codes' in r.data) {
            this.logger.error(
              `googleRecaptchaCheck error -> ${inspect(
                { error: r.data['error-codes'] },
                { depth: null },
              )}`,
            );
          }
          return 0.8 < (r.data?.score || 0);
        }),
        catchError((error) => {
          this.logger.error(
            `googleRecaptchaCheck error -> ${inspect({ error })}`,
          );
          return of(false);
        }),
      );
      const result = await firstValueFrom($src);
      return result;
    } catch (error) {
      this.logger.error(`googleRecaptchaCheck error -> ${inspect({ error })}`);
      return false;
    }
  }

  async resendConfirmationEmail(
    resendConfirmationEmailDto: ResendConfirmationEmailDto,
  ) {
    const { email } = resendConfirmationEmailDto;
    const baseUser = await this.usersService.findOneByEmail(email);

    if (!baseUser) {
      throw new BadRequestException();
    }

    if (baseUser.role !== UserRole.NON_VALIDATED_USER) {
      throw new ForbiddenException();
    }

    const user = this.serializationService.serializeUserResult(baseUser);

    await this.emailsService.sendUserValidationEmail(user);
  }

  async recoverPassword(recoverPasswordDto: RecoverPasswordDto) {
    const { email } = recoverPasswordDto;

    const baseUser = await this.usersService.findOneByEmail(email);

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

    await this.emailsService.sendPasswordRecoverToken(user);
    return { nonValidatedUser: false };
  }

  async verifyUser(verifyUserDto: VerifyUserDto) {
    const { token } = verifyUserDto;
    try {
      const { email } = this.tokenService.decodeToken<{ email: string }>(
        token,
        this.verifyUserSecret,
      );

      const baseUser = await this.usersService.findOneByEmail(email);

      if (!baseUser) {
        throw new BadRequestException();
      }

      if (baseUser.role !== UserRole.NON_VALIDATED_USER) {
        throw new ForbiddenException();
      }

      await this.usersService.update(baseUser.id, {
        role: UserRole.VALIDATED_USER,
      });
    } catch (error) {
      throw error;
    }
  }
}
