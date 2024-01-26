import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { GoogleRecaptchaV3 } from '../../shared/validators/google-recaptcha-v3.constraint';

export class SignUpEmailDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  name: string;

  @IsDefined()
  @IsNotEmpty()
  @Length(6, 50)
  @IsEmail()
  email: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(8, 20)
  password: string;

  @IsOptional()
  @IsString()
  @Length(14, 14)
  cpf?: string;

  @IsDefined()
  @IsNotEmpty()
  @GoogleRecaptchaV3({ message: 'recaptcha validation failed!' })
  recaptcha: string;
}
