import { LoginProvider } from '../../shared/enums/login-provider.enum';
import { CreateUserDto } from './create-email.interface';

export class CreateEmailUserDto implements CreateUserDto {
  name: string;
  password: string;
  email: string;
  cpf?: string;
  loginProviders: LoginProvider[];
  createdAt: number;
  updatedAt: number;
}
