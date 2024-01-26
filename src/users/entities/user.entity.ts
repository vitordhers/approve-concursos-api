import { LoginProvider } from '../../shared/enums/login-provider.enum';
import { UserRole } from '../../shared/enums/user-role.enum';
import { BaseUser } from '../interfaces/base-user.interface';
import { BaseEntity } from 'src/models/base-entity.model';
import { Entity } from 'src/db/enums/entity.enum';

export class User extends BaseEntity implements BaseUser {
  constructor(
    id: string,
    entity: Entity,
    createdAt: number,
    updatedAt: number,
    public name: string,
    public email: string,
    public role: UserRole,
    public loginProviders: LoginProvider[],
    public nextDueDate?: number,
    public cpf?: string,
  ) {
    super(id, entity, createdAt, updatedAt);
  }
}
