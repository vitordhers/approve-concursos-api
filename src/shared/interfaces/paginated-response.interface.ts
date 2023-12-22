import { FormattedResponse } from './formatted-response.interface';

export interface PaginatedResponse<T = any> extends FormattedResponse<T> {
  total: number;
}
