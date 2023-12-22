import { FilterType } from '../enums/filter-type.enum';

export type Filters =
  | SingleValueFilter
  | MultipleValuesFilter
  | RangeValueFilter
  | SelectorFilter;

export interface SingleValueFilter {
  type: FilterType.SINGLE_VALUE;
  key: string;
  value: string | number;
}

export interface MultipleValuesFilter {
  type: FilterType.MULTIPLE_VALUES;
  key: string;
  condition: 'AND' | 'OR';
  values: (string | number)[];
}

export interface RangeValueFilter {
  type: FilterType.RANGE;
  key: string;
  from: number;
  to: number;
}

export interface SelectorFilter {
  type: FilterType.SELECTOR;
  key: string;
  condition: 'OR';
  limit: number;
  fetch: string[];
  value: string | number;
}
