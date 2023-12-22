import { UserRole } from 'src/shared/enums/user-role.enum';
import { LoginProvider } from '../../shared/enums/login-provider.enum';

export interface CreateUserAdminDto {
  name: string;
  email: string;
  cpf?: string;
  password: string;
  loginProviders: LoginProvider[];
  createdAt: number;
  updatedAt: number;
  role: UserRole;
}
