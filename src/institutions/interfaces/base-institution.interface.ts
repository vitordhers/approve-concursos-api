import { BaseEntityInterface } from 'src/shared/interfaces/base-entity.interface';

export interface BaseInstitution extends BaseEntityInterface {
  id?: string;
  name: string;
  img?: string;
  thumb?: string;
}
