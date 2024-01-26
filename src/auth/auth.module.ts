import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminRoleStrategy } from './guards/admin-role.strategy';
import { LocalStrategy } from './guards/local.strategy';
import { GoogleRecaptchaV3Constraint } from '../shared/validators/google-recaptcha-v3.constraint';
import { TokensModule } from '../tokens/tokens.module';
import { AccessTokenStrategyConfigFactory } from './constants/access-token-config.const';
import { RefreshTokenStrategy } from './guards/refresh-token.strategy';
import { RefreshTokenStrategyConfigFactory } from './constants/refresh-token-config.const';
import { SerializationModule } from 'src/serialization/serialization.module';
import { AtLeastVerifiedUserStrategy } from './guards/at-least-verified-user.strategy';
import { PaidUserStrategy } from './guards/paid-user.strategy';
import { EmailsModule } from 'src/email/email.module';

@Module({
  imports: [
    UsersModule,
    HttpModule,
    PassportModule.register({
      defaultStrategy: ['accessToken', 'refreshToken', 'adminToken'],
    }),
    TokensModule,
    SerializationModule,
    EmailsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessTokenStrategyConfigFactory,
    RefreshTokenStrategyConfigFactory,
    // AccessTokenStrategy,
    AtLeastVerifiedUserStrategy,
    PaidUserStrategy,
    RefreshTokenStrategy,
    AdminRoleStrategy,
    LocalStrategy,
    GoogleRecaptchaV3Constraint,
  ],
  exports: [AuthService, GoogleRecaptchaV3Constraint],
})
export class AuthModule {}
