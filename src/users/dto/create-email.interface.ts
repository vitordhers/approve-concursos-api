import { LoginProvider } from '../../shared/enums/login-provider.enum';

export interface CreateUserDto {
  name: string;
  email: string;
  loginProviders: LoginProvider[];
  createdAt: number;
  updatedAt: number;
}
