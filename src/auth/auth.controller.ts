import {
  Body,
  Controller,
  Post,
  UseGuards,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/signin.dto';
import { RefreshToken } from './guards/refresh-token.guard';
import { GetDataFromRefreshToken } from './decorators/get-data-from-refresh-token.decorator';
import { Credentials } from './interfaces/credentials.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { Public } from './decorators/public.decorator';
import { ResendConfirmationEmailDto } from './dto/resend-validation-email.dto';
import { RecoverPasswordDto } from './dto/recover-password.dto';
import { VerifyUserDto } from './dto/verify-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @Public()
  async signIn(@Body() signInDto: SignInDto) {
    return await this.authService.signIn(signInDto);
  }

  @Patch()
  @Public()
  @UseGuards(RefreshToken)
  async refreshToken(
    @GetDataFromRefreshToken()
    { payload, refreshToken }: { payload: JwtPayload; refreshToken: string },
  ) {
    const accessToken = await this.authService.refreshAccessToken(payload);
    return { accessToken, refreshToken } as Credentials;
  }

  @HttpCode(HttpStatus.OK)
  @Post('resend')
  @Public()
  async resendConfirmationEmail(
    @Body() resendConfirmationEmailDto: ResendConfirmationEmailDto,
  ) {
    return await this.authService.resendConfirmationEmail(
      resendConfirmationEmailDto,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('recover')
  @Public()
  async recoverPassword(@Body() recoverPasswordDto: RecoverPasswordDto) {
    return await this.authService.recoverPassword(recoverPasswordDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify')
  @Public()
  async verifyUser(@Body() verifyUserDto: VerifyUserDto) {
    return await this.authService.verifyUser(verifyUserDto);
  }
}
