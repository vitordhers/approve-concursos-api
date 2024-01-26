import { FilterType } from '../enums/filter-type.enum';
import { QuestionFilter } from '../enums/question-filters.enum';

export type QuestionFilters =
  | SingleValueQuestionFilter
  | MultipleValuesQuestionFilter
  | RangeValueQuestionFilter
  | SelectorQuestionFilter;

type SingleValueId =
  | QuestionFilter.year
  | QuestionFilter.institutionId
  | QuestionFilter.educationStage;

type MultipleValueId = QuestionFilter.boardIdOR | QuestionFilter.subjectIdOR;

type RangeValueId = QuestionFilter.fromTo;

type SelectorValueId = QuestionFilter.subjectIdSELECTOR;

type QuestionFilterId =
  | SingleValueId
  | MultipleValueId
  | RangeValueId
  | SelectorValueId;

interface BaseQuestionFilter {
  id: QuestionFilterId;
  type: FilterType;
  key: string;
  value?: string | number;
  values?: (string | number)[];
}
export interface SingleValueQuestionFilter extends BaseQuestionFilter {
  id: SingleValueId;
  key: string;
  type: FilterType.SINGLE_VALUE;
  value: string | number;
}

export interface MultipleValuesQuestionFilter extends BaseQuestionFilter {
  id: MultipleValueId;
  key: string;
  type: FilterType.MULTIPLE_VALUES;
  condition: 'AND' | 'OR';
  values: (string | number)[];
}

export interface RangeValueQuestionFilter extends BaseQuestionFilter {
  id: RangeValueId;
  key: string;
  type: FilterType.RANGE;
  values: [number, number];
}

export interface SelectorQuestionFilter extends BaseQuestionFilter {
  id: SelectorValueId;
  key: string;
  type: FilterType.SELECTOR;
  condition: 'OR';
  values: [number, string];
}
