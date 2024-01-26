import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from 'jsonwebtoken';
import { UsersService } from '../../users/users.service';
import { UserRole } from 'src/shared/enums/user-role.enum';

@Injectable()
export class PaidUserStrategy extends PassportStrategy(
  Strategy,
  'paidUserStrategy',
) {
  constructor(
    @Inject('ACCESS_TOKEN_STRATEGY_CONFIG')
    private accessTokenStrategyConfig: { secret: string },
    private userService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: accessTokenStrategyConfig.secret,
    });
  }

  async validate(payload: JwtPayload) {
    const { id: uid } = payload;
    const user = await this.userService.findOne(uid);
    if (!user || user.role < UserRole.PAID_USER) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
