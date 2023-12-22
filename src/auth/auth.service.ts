import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcryptjs';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, map } from 'rxjs';
// import { v4 as uuid } from 'uuid';
import { SignInDto } from './dto/signin.dto';
import { TokenService } from '../tokens/tokens.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User } from 'src/users/entities/user.entity';
import { SerializationService } from 'src/serialization/serialization.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
    private httpService: HttpService,
    private tokenService: TokenService,
    private serializationService: SerializationService,
  ) {}

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new BadRequestException();
    }

    const { id, role } = user;
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
    const secret_key = this.configService.get<string>(
      'GOOGLE_RECAPTCHA_SECRET',
    );
    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret_key}&response=${response}`;
    const $src = await this.httpService
      .post(url)
      .pipe(map((r) => r.data?.score > 0.7));
    const result = firstValueFrom($src);
    return result;
  }
}
