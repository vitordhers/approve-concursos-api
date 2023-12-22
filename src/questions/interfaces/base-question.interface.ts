import { BaseBoard } from 'src/boards/interfaces/base-board.interface';
import { BaseExam } from 'src/exams/interfaces/base-exam.interface';
import { BaseInstitution } from 'src/institutions/interfaces/base-institution.interface';
import { EducationStage } from 'src/shared/enums/education-stage.enum';
import { Alternative } from 'src/shared/interfaces/alternative.interface';
import { BaseEntityInterface } from 'src/shared/interfaces/base-entity.interface';
import { BaseSubject } from 'src/subjects/interfaces/base-subject.interface';

export interface BaseQuestion extends BaseEntityInterface {
  id?: string;
  code?: string;
  prompt: string;
  subjectId: string | BaseSubject;
  alternatives: Alternative[];
  answerExplanation: string;
  correctIndex?: number;
  illustration?: string;
  year?: number;
  institutionId?: string | BaseInstitution;
  boardId?: string | BaseBoard;
  examId?: string | BaseExam;
  educationStage?: EducationStage;
  createdAt: number;
  updatedAt: number;
  subject?: BaseSubject;
  board?: BaseBoard;
  institution?: BaseInstitution;
  exam?: BaseExam;
}
