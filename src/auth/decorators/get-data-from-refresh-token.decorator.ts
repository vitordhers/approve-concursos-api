import { createParamDecorator } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

export const GetDataFromRefreshToken = createParamDecorator(
  (_, ctx: ExecutionContextHost) => {
    const request = ctx.switchToHttp().getRequest();
    return {
      payload: {
        id: request.user.id,
        role: request.user.role,
      },
      refreshToken: request.headers['x-refresh-token'],
    } as { payload: JwtPayload; refreshToken: string };
  },
);
