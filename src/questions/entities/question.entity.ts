import { BaseEntity } from 'src/models/base-entity.model';
import { BaseQuestion } from '../interfaces/base-question.interface';
import { Entity } from 'src/db/enums/entity.enum';
import { Alternative } from 'src/shared/interfaces/alternative.interface';
import { EducationStage } from 'src/shared/enums/education-stage.enum';
import { Subject } from 'src/subjects/entities/subject.entity';
import { Board } from 'src/boards/entities/board.entity';
import { Institution } from 'src/institutions/entities/institution.entity';
import { Exam } from 'src/exams/entities/exam.entity';

export class Question extends BaseEntity implements BaseQuestion {
  constructor(
    id: string,
    entityId: Entity,
    public code: string,
    public prompt: string,
    public correctIndex: number,
    public subjectId: string,
    public alternatives: Alternative[],
    public answerExplanation: string,
    createdAt: number,
    updatedAt: number,
    public illustration?: string,
    public year?: number,
    public institutionId?: string,
    public boardId?: string,
    public examId?: string,
    public educationStage?: EducationStage,
    public subject?: Subject,
    public board?: Board,
    public institution?: Institution,
    public exam?: Exam,
  ) {
    super(id, entityId, createdAt, updatedAt);
  }
}

export class AnswerableQuestion extends BaseEntity implements BaseQuestion {
  constructor(
    id: string,
    entityId: Entity,
    public code: string,
    public prompt: string,
    public subjectId: string,
    public alternatives: Alternative[],
    createdAt: number,
    updatedAt: number,
    public illustration?: string,
    public year?: number,
    public institutionId?: string,
    public boardId?: string,
    public examId?: string,
    public educationStage?: EducationStage,
    public subject?: Subject,
    public board?: Board,
    public institution?: Institution,
    public exam?: Exam,
  ) {
    super(id, entityId, createdAt, updatedAt);
  }
}
