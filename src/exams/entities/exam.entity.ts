import { Board } from 'src/boards/entities/board.entity';
import { Entity } from 'src/db/enums/entity.enum';
import { Institution } from 'src/institutions/entities/institution.entity';
import { BaseEntity } from 'src/models/base-entity.model';
import {
  AnswerableQuestion,
  Question,
} from 'src/questions/entities/question.entity';
import { ExamType } from 'src/shared/enums/exam-type.enum';
import { BaseExam } from '../interfaces/base-exam.interface';

export class Exam extends BaseEntity implements BaseExam {
  constructor(
    id: string,
    entityId: Entity,
    public code: string,
    public name: string,
    public type: ExamType,
    public questionsIds: string[],
    createdAt: number,
    updatedAt: number,
    public year?: number,
    public boardId?: string,
    public institutionId?: string,
    public questions?: Question[],
    public answerableQuestions?: AnswerableQuestion[],
    public institution?: Institution,
    public board?: Board,
  ) {
    super(id, entityId, createdAt, updatedAt);
  }
}
