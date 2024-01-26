import { IsDefined, IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { GoogleRecaptchaV3 } from 'src/shared/validators/google-recaptcha-v3.constraint';

export class RecoverPasswordDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @IsDefined()
  @IsNotEmpty()
  @GoogleRecaptchaV3({ message: 'recaptcha validation failed!' })
  recaptcha: string;
}
