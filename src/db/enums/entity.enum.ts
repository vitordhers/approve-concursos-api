export enum Entity {
  USERS = 'users',
  QUESTIONS = 'questions',
  BOARDS = 'boards',
  EXAMS = 'exams',
  SUBJECTS = 'subjects',
  INSTITUTIONS = 'institutions',
}

export type ExtendedEntity = Entity | 'database' | 'migrations';
