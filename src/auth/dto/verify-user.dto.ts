import { IsDefined, IsNotEmpty, IsString } from 'class-validator';
import { GoogleRecaptchaV3 } from 'src/shared/validators/google-recaptcha-v3.constraint';

export class VerifyUserDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsDefined()
  @IsNotEmpty()
  @GoogleRecaptchaV3({ message: 'recaptcha validation failed!' })
  recaptcha: string;
}
