import { EnumUtils } from '../utils/enum-utilities.model';

export enum QuestionFilter {
  year = 'year',
  institutionId = 'institutionId',
  educationStage = 'educationStage',
  fromTo = 'fromTo',
  boardIdOR = 'boardIdOR',
  subjectIdOR = 'subjectIdOR',
  subjectIdSELECTOR = 'subjectIdSELECTOR',
}

export const QuestionFilterKeys = EnumUtils.enumKeys(QuestionFilter);
export const QuestionFilterDict = EnumUtils.enumObject(QuestionFilter);

export type QuestionFilterKey = keyof typeof QuestionFilter;
export type QuestionFilterType = typeof QuestionFilterDict;

export interface QuestionPrefilterQueryParams {
  year?: string;
  fromTo?: string;
  institutionId?: string;
  educationStage?: string;
  boardIdOR?: string;
}

export interface QuestionFilterQueryParams
  extends QuestionPrefilterQueryParams {
  subjectIdSELECTOR?: string;
}
