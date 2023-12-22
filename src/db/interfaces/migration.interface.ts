import { ExtendedEntity } from '../enums/entity.enum';
import { MigrationType } from '../enums/migration-type.enum';

export interface MigrationBase {
  id?: string;
  type: MigrationType;
  name: string;
  query: string;
  table: ExtendedEntity;
  createdAt?: number;
  updatedAt?: number;
}
