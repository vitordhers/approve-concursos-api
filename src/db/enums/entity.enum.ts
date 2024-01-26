export enum Entity {
  USERS = 'users',
  QUESTIONS = 'questions',
  BOARDS = 'boards',
  EXAMS = 'exams',
  SUBJECTS = 'subjects',
  INSTITUTIONS = 'institutions',
}

export type DatabaseEntity = 'database' | 'migrations';
export type OrderEntity = 'orders' | 'payments' | 'charges';
export type ExtendedEntity = Entity | DatabaseEntity | OrderEntity;
