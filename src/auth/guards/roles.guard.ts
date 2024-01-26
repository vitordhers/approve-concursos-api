import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/shared/enums/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const atLeastrequiredRole = this.reflector.getAllAndOverride<UserRole>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!atLeastrequiredRole) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return user.role >= atLeastrequiredRole;
  }
}
