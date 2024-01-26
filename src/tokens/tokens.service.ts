import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Credentials } from '../auth/interfaces/credentials.interface';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Algorithms } from './enums/algorithms.enum';

@Injectable()
export class TokenService {
  // ATTENTION: this service won't budge on Node16

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async getCredentials(
    payload: JwtPayload,
    returnRefreshToken = false,
  ): Promise<Credentials> {
    const credentials: Credentials = {
      accessToken: this.createAccessToken(payload),
    };
    if (returnRefreshToken) {
      credentials.refreshToken = this.createRefreshToken(payload);
    }
    return credentials;
  }

  createAccessToken(payload: JwtPayload) {
    const secret = this.configService.get<string>(
      'ACCESS_TOKEN_SECRET_PRIVATE',
    );

    return this.jwtService.sign(payload, {
      secret,
      expiresIn: '30m',
      algorithm: Algorithms.ES384,
    });
  }

  createRefreshToken(payload: JwtPayload) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET_PRIVATE'),
      expiresIn: '30d',
      algorithm: Algorithms.ES512,
    });
  }

  createMailConfirmationToken(email: string) {
    return this.jwtService.sign(
      { email },
      {
        secret: this.configService.get<string>('MAIL_REQUESTS_TOKEN_SECRET'),
        expiresIn: '7d',
        algorithm: Algorithms.ES256,
      },
    );
  }

  createPasswordRecoveryToken(email: string) {
    return this.jwtService.sign(
      { email },
      {
        secret: this.configService.get<string>(
          'PASSWORD_RECOVERY_TOKEN_SECRET',
        ),
        expiresIn: '10m',
        algorithm: Algorithms.ES256,
      },
    );
  }

  decodeToken<T extends object>(token: string, secret: string) {
    return this.jwtService.verify<T>(token, { secret });
  }
}
