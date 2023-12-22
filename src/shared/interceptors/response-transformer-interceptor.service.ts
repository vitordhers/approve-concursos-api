import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { inspect } from 'util';
import { FormattedResponse } from '../interfaces/formatted-response.interface';
import { PaginatedResponse } from '../interfaces/paginated-response.interface';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  logger = new Logger('ResponseTransformInterceptor');
  intercept(_: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((response) =>
        response && typeof response === 'object' && 'total' in response
          ? ({
              success: true,
              total: response.total,
              data: response.data,
            } as PaginatedResponse)
          : ({
              success: true,
              data: response,
            } as FormattedResponse),
      ),
      catchError((error) => {
        return throwError(() => {
          this.logger.error(
            `intercept error: ${inspect({ error }, { depth: null })}`,
          );
          throw new HttpException(
            {
              success: false,
              error: error?.response?.message || 'Internal Server Error',
            },
            error.status || 500,
          );
        });
      }),
    );
  }
}
