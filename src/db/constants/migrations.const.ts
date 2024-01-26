import { Entity } from '../enums/entity.enum';
import { MigrationType } from '../enums/migration-type.enum';
import { MigrationBase } from '../interfaces/migration.interface';

export const MIGRATIONS = new Map<Entity | 'database', MigrationBase[]>();

const autocompletePtAnalyzerMigration: MigrationBase = {
  name: 'simplePt',
  type: MigrationType.ANALYZER,
  table: 'database',
  query:
    'DEFINE ANALYZER simplePt TOKENIZERS blank, class, punct FILTERS snowball(Portuguese), edgengram(1,3);',
};

const createNameIndexOnSubjects: MigrationBase = {
  name: 'nameIndex',
  type: MigrationType.INDEX,
  table: Entity.SUBJECTS,
  query: `DEFINE INDEX nameIndex ON TABLE ${Entity.SUBJECTS} COLUMNS name SEARCH ANALYZER simplePt BM25 HIGHLIGHTS;`,
};

const createNameIndexOnInstitutions: MigrationBase = {
  name: 'nameIndex',
  type: MigrationType.INDEX,
  table: Entity.INSTITUTIONS,
  query: `DEFINE INDEX nameIndex ON TABLE ${Entity.INSTITUTIONS} COLUMNS name SEARCH ANALYZER simplePt BM25 HIGHLIGHTS;`,
};

const createNameIndexOnBoards: MigrationBase = {
  name: 'nameIndex',
  type: MigrationType.INDEX,
  table: Entity.BOARDS,
  query: `DEFINE INDEX nameIndex ON TABLE ${Entity.BOARDS} COLUMNS name SEARCH ANALYZER simplePt BM25 HIGHLIGHTS;`,
};

const createCodeUniqueIndexOnQuestions: MigrationBase = {
  name: 'codeUniqueIndex',
  type: MigrationType.INDEX,
  table: Entity.QUESTIONS,
  query: `DEFINE INDEX codeUniqueIndex ON TABLE ${Entity.QUESTIONS} COLUMNS code UNIQUE;`,
};

const createCodeSearchIndexOnQuestions: MigrationBase = {
  name: 'codeSearchIndex',
  type: MigrationType.INDEX,
  table: Entity.QUESTIONS,
  query: `DEFINE INDEX codeSearchIndex ON TABLE ${Entity.QUESTIONS} COLUMNS code SEARCH ANALYZER simplePt BM25 HIGHLIGHTS;`,
};

const createPromptSearchIndexOnQuestions: MigrationBase = {
  name: 'promptSearchIndex',
  type: MigrationType.INDEX,
  table: Entity.QUESTIONS,
  query: `DEFINE INDEX promptSearchIndex ON TABLE ${Entity.QUESTIONS} COLUMNS prompt SEARCH ANALYZER simplePt BM25 HIGHLIGHTS;`,
};

const createCodeUniqueIndexOnExams: MigrationBase = {
  name: 'codeUniqueIndex',
  type: MigrationType.INDEX,
  table: Entity.EXAMS,
  query: `DEFINE INDEX codeUniqueIndex ON TABLE ${Entity.EXAMS} COLUMNS code UNIQUE;`,
};

const createNameCodeIndexSearchOnExams: MigrationBase = {
  name: 'nameCodeIndex',
  type: MigrationType.INDEX,
  table: Entity.EXAMS,
  query: `DEFINE INDEX nameCodeIndex ON TABLE ${Entity.EXAMS} COLUMNS code, name SEARCH ANALYZER simplePt BM25 HIGHLIGHTS;`,
};

const createEmailUniqueIndexOnUsers: MigrationBase = {
  name: 'emailUniqueIndex',
  type: MigrationType.INDEX,
  table: Entity.USERS,
  query: `DEFINE INDEX emailUniqueIndex ON TABLE ${Entity.USERS} COLUMNS email UNIQUE;`,
};

MIGRATIONS.set('database', [autocompletePtAnalyzerMigration]);

MIGRATIONS.set(Entity.SUBJECTS, [createNameIndexOnSubjects]);

MIGRATIONS.set(Entity.INSTITUTIONS, [createNameIndexOnInstitutions]);

MIGRATIONS.set(Entity.BOARDS, [createNameIndexOnBoards]);

MIGRATIONS.set(Entity.QUESTIONS, [
  createCodeUniqueIndexOnQuestions,
  createCodeSearchIndexOnQuestions,
  createPromptSearchIndexOnQuestions,
]);

MIGRATIONS.set(Entity.EXAMS, [
  createCodeUniqueIndexOnExams,
  createNameCodeIndexSearchOnExams,
]);

MIGRATIONS.set(Entity.USERS, [createEmailUniqueIndexOnUsers]);
