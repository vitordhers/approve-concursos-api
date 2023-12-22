import { Injectable, Logger } from '@nestjs/common';
import { Board } from 'src/boards/entities/board.entity';
import { BaseBoard } from 'src/boards/interfaces/base-board.interface';
import { Entity, ExtendedEntity } from 'src/db/enums/entity.enum';
import { Exam } from 'src/exams/entities/exam.entity';
import { BaseExam } from 'src/exams/interfaces/base-exam.interface';
import { Institution } from 'src/institutions/entities/institution.entity';
import { BaseInstitution } from 'src/institutions/interfaces/base-institution.interface';
import { Question } from 'src/questions/entities/question.entity';
import { BaseQuestion } from 'src/questions/interfaces/base-question.interface';
import { RelationType } from 'src/shared/enums/relation-type.enum';
import { Relation } from 'src/shared/interfaces/relation.interface';
import { Subject } from 'src/subjects/entities/subject.entity';
import { BaseSubject } from 'src/subjects/interfaces/base-subject.interface';
import { User } from 'src/users/entities/user.entity';
import { BaseUser } from 'src/users/interfaces/base-user.interface';
import { inspect } from 'util';

@Injectable()
export class SerializationService {
  private logger = new Logger('SerializationService');
  constructor() {}

  surrealIdToRegularUid(id: string) {
    if (!id.includes(':')) {
      return id;
    }
    const uid = id.split(':')[1];
    if (!id) {
      this.logger.warn(`missing uid: ${inspect({ id, uid })}`);
    }
    return uid;
  }

  regularUidToSurrealId(entity: ExtendedEntity, uid: string) {
    return `${entity}:${uid}`;
  }

  serializeUserResult(baseUser: BaseUser) {
    return new User(
      this.surrealIdToRegularUid(baseUser.id),
      Entity.USERS,
      baseUser.createdAt,
      baseUser.updatedAt,
      baseUser.name,
      baseUser.email,
      baseUser.role,
      baseUser.loginProviders,
      baseUser.cpf,
    );
  }

  serializeQuestionResult(
    {
      id,
      code,
      prompt,
      correctIndex,
      subjectId,
      alternatives,
      answerExplanation,
      createdAt,
      updatedAt,
      illustration,
      year,
      institutionId,
      boardId,
      examId,
      educationStage,
      subject,
      board,
      institution,
      exam,
    }: BaseQuestion,
    serializeRelations = false,
  ) {
    return new Question(
      this.surrealIdToRegularUid(id),
      Entity.QUESTIONS,
      code,
      prompt,
      correctIndex,
      typeof subjectId === 'string'
        ? this.surrealIdToRegularUid(subjectId)
        : this.surrealIdToRegularUid(subjectId.id),
      alternatives,
      answerExplanation,
      createdAt,
      updatedAt,
      illustration,
      year,
      institutionId
        ? typeof institutionId === 'string'
          ? this.surrealIdToRegularUid(institutionId)
          : this.surrealIdToRegularUid(institutionId.id)
        : undefined,
      boardId
        ? typeof boardId === 'string'
          ? this.surrealIdToRegularUid(boardId)
          : this.surrealIdToRegularUid(boardId.id)
        : undefined,
      examId
        ? typeof examId === 'string'
          ? this.surrealIdToRegularUid(examId)
          : this.surrealIdToRegularUid(examId.id)
        : undefined,
      educationStage,
      serializeRelations &&
      (subject || (subjectId && typeof subjectId === 'object'))
        ? this.serializeSubjectResult(
            subject ? subject : (subjectId as BaseSubject),
          )
        : undefined,
      serializeRelations && (board || (boardId && typeof boardId === 'object'))
        ? this.serializeBoardResult(board ? board : (boardId as BaseBoard))
        : undefined,
      serializeRelations &&
      (institution || (institutionId && typeof institutionId === 'object'))
        ? this.serializeInstitutionResult(
            institution ? institution : (institutionId as BaseInstitution),
          )
        : undefined,
      serializeRelations && (exam || (examId && typeof examId === 'object'))
        ? this.serializeExamResult(exam ? exam : (examId as BaseExam), false)
        : undefined,
    );
  }

  serializeExamResult(
    {
      id,
      createdAt,
      updatedAt,
      code,
      name,
      type,
      questionsIds,
      year,
      boardId,
      institutionId,
      questions,
      institution,
      board,
    }: BaseExam,
    serializeRelations = false,
  ): Exam {
    return new Exam(
      this.surrealIdToRegularUid(id),
      Entity.EXAMS,
      code,
      name,
      type,
      questionsIds.map((uid) => this.surrealIdToRegularUid(uid)),
      createdAt,
      updatedAt,
      year,
      boardId ? this.surrealIdToRegularUid(boardId) : undefined,
      institutionId ? this.surrealIdToRegularUid(institutionId) : undefined,
      serializeRelations && questions && questions.length
        ? questions.map((q) => this.serializeQuestionResult(q, false))
        : undefined,
      serializeRelations && institution
        ? this.serializeInstitutionResult(institution)
        : undefined,
      serializeRelations && board
        ? this.serializeBoardResult(board)
        : undefined,
    );
  }

  serializeInstitutionResult({
    id,
    name,
    updatedAt,
    createdAt,
    img,
    thumb,
  }: BaseInstitution) {
    return new Institution(
      this.surrealIdToRegularUid(id),
      Entity.INSTITUTIONS,
      createdAt,
      updatedAt,
      name,
      img,
      thumb,
    );
  }

  serializeBoardResult({
    id,
    name,
    updatedAt,
    createdAt,
    img,
    thumb,
  }: BaseBoard) {
    return new Board(
      this.surrealIdToRegularUid(id),
      Entity.BOARDS,
      createdAt,
      updatedAt,
      name,
      img,
      thumb,
    );
  }

  serializeSubjectResult({
    id,
    name,
    updatedAt,
    createdAt,
    img,
    thumb,
  }: BaseSubject) {
    return new Subject(
      this.surrealIdToRegularUid(id),
      Entity.SUBJECTS,
      createdAt,
      updatedAt,
      name,
      img,
      thumb,
    );
  }

  serializeRecordId<T = any>(result: Record<string, any>) {
    const id = this.surrealIdToRegularUid(result.id);
    return { ...result, id } as T;
  }

  serializeRecordAndRelationIds<T = any>(
    result: Record<string, any>,
    relations: Relation[],
  ) {
    const id = this.surrealIdToRegularUid(result.id);
    result = { ...result, id };
    relations.forEach((relation) => {
      if (relation.type === RelationType.VALUE) {
        if (result[relation.alias]) {
          result[relation.alias].id = this.surrealIdToRegularUid(
            result[relation.alias].id,
          );
        }
        result[relation.idCol] = this.surrealIdToRegularUid(
          result[relation.idCol],
        );
        return;
      }
      (result[relation.alias] || []).forEach(
        (e) => (e.id = this.surrealIdToRegularUid(e.i)),
      );
      (result[relation.idCol] || []).forEach(
        (r) => (r.id = this.surrealIdToRegularUid(r.id)),
      );
    });
    return result as T;
  }
}
