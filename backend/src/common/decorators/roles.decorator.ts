import { SetMetadata } from '@nestjs/common';

export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
}

export type RoleString = 'admin' | 'teacher' | 'student';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: (UserRole | RoleString)[]) => SetMetadata(ROLES_KEY, roles);
