import { BaseEntity } from 'src/models/base-entity.model';
import { Entity } from 'src/db/enums/entity.enum';
import { BaseBoard } from '../interfaces/base-board.interface';

export class Board extends BaseEntity implements BaseBoard {
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
