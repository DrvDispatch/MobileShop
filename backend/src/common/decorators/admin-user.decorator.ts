/**
 * Admin User Decorator
 * 
 * Extract authenticated admin user from request.
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AdminUserData {
    id: string;
    email: string;
    name: string;
    role: string;
}

/**
 * Decorator to extract admin user from request
 * Usage: @AdminUser() admin: AdminUserData
 */
export const AdminUser = createParamDecorator(
    (data: keyof AdminUserData | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            return null;
        }

        if (data) {
            return user[data];
        }

        return {
            id: user.sub || user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        };
    },
);

/**
 * Decorator to require specific admin roles
 * Usage: @RequireRole('SUPER_ADMIN', 'ADMIN')
 */
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const RequireRole = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
