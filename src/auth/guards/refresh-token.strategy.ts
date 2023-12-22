import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from 'jsonwebtoken';
import { UsersService } from '../../users/users.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'refreshToken',
) {
  constructor(
    @Inject('REFRESH_TOKEN_STRATEGY_CONFIG')
    private readonly refreshTokenStrategyConfig: { secret: string },
    private userService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromHeader('x-refresh-token'),
      secretOrKey: refreshTokenStrategyConfig.secret,
    });
  }

  async validate(payload: JwtPayload) {
    const { id } = payload;
    const user = await this.userService.findOne(id);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
