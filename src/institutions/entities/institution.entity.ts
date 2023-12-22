import { BaseEntity } from 'src/models/base-entity.model';
import { Entity } from 'src/db/enums/entity.enum';
import { BaseInstitution } from '../interfaces/base-institution.interface';

export class Institution extends BaseEntity implements BaseInstitution {
  constructor(
    id: string,
    entityId: Entity,
    createdAt: number,
    updatedAt: number,
    public name: string,
    public img?: string,
    public thumb?: string,
  ) {
    super(id, entityId, createdAt, updatedAt);
  }
}
