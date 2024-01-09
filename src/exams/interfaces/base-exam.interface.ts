import { BaseBoard } from 'src/boards/interfaces/base-board.interface';
import { Entity } from 'src/db/enums/entity.enum';
import { BaseInstitution } from 'src/institutions/interfaces/base-institution.interface';
import { BaseQuestion } from 'src/questions/interfaces/base-question.interface';
import { ExamType } from 'src/shared/enums/exam-type.enum';
import { BaseEntityInterface } from 'src/shared/interfaces/base-entity.interface';

export interface BaseExam extends BaseEntityInterface {
  // id: string;
  entityId?: Entity;
  createdAt: number;
  updatedAt: number;
  code: string;
  name: string;
  type: ExamType;
  questionsIds: string[];
  year?: number;
  boardId?: string;
  institutionId?: string;
  questions?: BaseQuestion[];
  answerableQuestions?: BaseQuestion[];
  institution?: BaseInstitution;
  board?: BaseBoard;
}
