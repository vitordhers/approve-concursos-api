import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from 'jsonwebtoken';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../shared/enums/user-role.enum';

@Injectable()
export class AdminRoleStrategy extends PassportStrategy(
  Strategy,
  'adminToken',
) {
  constructor(
    @Inject('ACCESS_TOKEN_STRATEGY_CONFIG')
    private readonly accessTokenStrategyConfig: { secret: string },
    private userService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: accessTokenStrategyConfig.secret,
    });
  }

  async validate(payload: JwtPayload) {
    const { id } = payload;
    const user = await this.userService.findOne(id);

    if (!user || user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
