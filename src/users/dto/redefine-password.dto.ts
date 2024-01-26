import { IsDefined, IsNotEmpty, IsString, Length } from 'class-validator';
import { GoogleRecaptchaV3 } from 'src/shared/validators/google-recaptcha-v3.constraint';

export class RedefinePasswordDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(8, 20)
  password: string;

  @IsDefined()
  @IsNotEmpty()
  @GoogleRecaptchaV3({ message: 'recaptcha validation failed!' })
  recaptcha: string;
}
