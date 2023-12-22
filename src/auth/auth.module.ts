import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccessTokenStrategy } from './guards/jwt.strategy';
import { AdminRoleStrategy } from './guards/admin-role.strategy';
import { LocalStrategy } from './guards/local.strategy';
import { RefreshTokenStrategy } from './guards/refresh-token.strategy';
import { GoogleRecaptchaV3Constraint } from '../shared/validators/google-recaptcha-v3.constraint';
import { TokensModule } from '../tokens/tokens.module';
import { AccessTokenStrategyConfigFactory } from './constants/access-token-config.const';
import { RefreshTokenStrategyConfigFactory } from './constants/refresh-token-config.const';
import { SerializationModule } from 'src/serialization/serialization.module';

@Module({
  imports: [
    UsersModule,
    HttpModule,
    PassportModule.register({
      defaultStrategy: ['accessToken', 'refreshToken', 'adminToken'],
    }),
    TokensModule,
    SerializationModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessTokenStrategyConfigFactory,
    RefreshTokenStrategyConfigFactory,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    AdminRoleStrategy,
    LocalStrategy,
    GoogleRecaptchaV3Constraint,
  ],
  exports: [AuthService, GoogleRecaptchaV3Constraint],
})
export class AuthModule {}
