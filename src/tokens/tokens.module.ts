import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './tokens.service';

const jwtModule = JwtModule.register({});
@Module({
  imports: [jwtModule],
  providers: [TokenService],
  exports: [TokenService, jwtModule],
})
export class TokensModule {}
