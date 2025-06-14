import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@/types';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required user roles for accessing a route
 * @param roles - Array of required roles
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
