import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../generated/prisma/client.js';

export const ROLES_KEY = 'roles';
// Accept both UserRole enum values and string literals for flexibility
// This allows using 'OWNER' as a string while enum is being updated
export const Roles = (...roles: (UserRole | string)[]) => SetMetadata(ROLES_KEY, roles);
