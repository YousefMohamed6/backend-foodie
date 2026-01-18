import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      this.logger.warn('User or user.role is missing');
      return false;
    }

    // Debug logging
    this.logger.debug(`User role: "${user.role}" (type: ${typeof user.role})`);
    this.logger.debug(`Required roles: ${requiredRoles.map(r => `"${r}"`).join(', ')}`);

    // Normalize user role to uppercase for comparison
    const userRoleNormalized = String(user.role).toUpperCase();

    const hasAccess = requiredRoles.some((role) => {
      // Normalize required role to uppercase for comparison
      const requiredRoleNormalized = String(role).toUpperCase();
      const matches = userRoleNormalized === requiredRoleNormalized;
      this.logger.debug(`Comparing "${userRoleNormalized}" === "${requiredRoleNormalized}": ${matches}`);
      return matches;
    });

    if (!hasAccess) {
      this.logger.warn(`Access denied for user role "${user.role}". Required: ${requiredRoles.join(', ')}`);
    }

    return hasAccess;
  }
}
