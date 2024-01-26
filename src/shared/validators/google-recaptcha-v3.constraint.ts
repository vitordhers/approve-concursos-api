import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

@ValidatorConstraint({ name: 'GoogleRecaptchaV3', async: true })
@Injectable()
export class GoogleRecaptchaV3Constraint
  implements ValidatorConstraintInterface
{
  constructor(private authService: AuthService) {}

  async validate(recaptcha: string) {
    return await this.authService.googleRecaptchaCheck(recaptcha);
  }
}

export function GoogleRecaptchaV3(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: GoogleRecaptchaV3Constraint,
    });
  };
}
