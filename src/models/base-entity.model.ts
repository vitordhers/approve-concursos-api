import { Entity } from '../db/enums/entity.enum';

export class BaseEntity {
  constructor(
    public id: string,
    public entityId: Entity,
    public createdAt: number,
    public updatedAt: number,
  ) {}

  get createdDate() {
    return new Date(this.createdAt);
  }

  get updatedDate() {
    return new Date(this.updatedAt);
  }
}
