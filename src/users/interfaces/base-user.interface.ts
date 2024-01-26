import { BaseEntityInterface } from 'src/shared/interfaces/base-entity.interface';
import { LoginProvider } from '../../shared/enums/login-provider.enum';
import { UserRole } from '../../shared/enums/user-role.enum';

export interface BaseUser extends BaseEntityInterface {
  id: string;
  name: string;
  email: string;
  password?: string;
  cpf?: string;
  role: UserRole;
  loginProviders: LoginProvider[];
  nextDueDate?: number;
}
