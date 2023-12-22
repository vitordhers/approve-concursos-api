import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';
import { GoogleRecaptchaV3 } from '../../shared/validators/google-recaptcha-v3.constraint';

export class SignInDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(6, 50)
  @IsEmail()
  email: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(8, 20)
  password: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @GoogleRecaptchaV3({ message: 'recaptcha validation failed!' })
  recaptcha: string;
}
