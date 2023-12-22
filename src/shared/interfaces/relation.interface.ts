import { Entity } from 'src/db/enums/entity.enum';
import { RelationType } from '../enums/relation-type.enum';

export interface Relation {
  idCol: string;
  entity: Entity;
  type: RelationType;
  fields?: string[];
  alias: string;
}
