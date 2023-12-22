import { BaseEntity } from 'src/models/base-entity.model';
import { Entity } from 'src/db/enums/entity.enum';
import { BaseSubject } from '../interfaces/base-subject.interface';

export class Subject extends BaseEntity implements BaseSubject {
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
