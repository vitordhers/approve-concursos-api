import { Entity } from 'src/db/enums/entity.enum';

export interface BaseEntityInterface {
  id?: string;
  entityId?: Entity;
  createdAt?: number;
  updatedAt?: number;
}
