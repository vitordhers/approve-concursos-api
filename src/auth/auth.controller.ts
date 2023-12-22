import { Body, Controller, Post, UseGuards, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/signin.dto';
import { RefreshToken } from './guards/refresh-token.guard';
import { GetDataFromRefreshToken } from './decorators/get-data-from-refresh-token.decorator';
import { Credentials } from './interfaces/credentials.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  async signIn(@Body() signInDto: SignInDto) {
    return await this.authService.signIn(signInDto);
  }

  @Patch()
  @UseGuards(RefreshToken)
  async refreshToken(
    @GetDataFromRefreshToken()
    { payload, refreshToken }: { payload: JwtPayload; refreshToken: string },
  ) {
    const accessToken = await this.authService.refreshAccessToken(payload);
    return { accessToken, refreshToken } as Credentials;
  }
}
