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

  decodeToken(token: string, publicKey: string) {
    return this.jwtService.verify(token, { publicKey });
  }
}
