import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Guard that restricts access to OWNER users only.
 * OWNER users must have:
 * - role = OWNER
 * - tenantId = null (platform-level access)
 */
@Injectable()
export class OwnerGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Authentication required');
        }

        // Must be OWNER role with null tenantId
        if (user.role !== 'OWNER') {
            throw new ForbiddenException('Owner access required');
        }

        if (user.tenantId !== null && user.tenantId !== undefined) {
            throw new ForbiddenException('Platform-level access required');
        }

        return true;
    }
}
