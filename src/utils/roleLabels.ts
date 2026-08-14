import type { Role } from '../types';

// Thai display labels for each Role value — used anywhere a role badge or
// role-switcher list is rendered (Navbar, TestLoginModal).
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'แอดมิน',
  HR: 'HR',
  SUPERVISOR: 'หัวหน้าแผนกอาวุโส',
  EMPLOYEE: 'พนักงาน',
};

// Roles that actually log into the platform themselves. Rank-and-file
// EMPLOYEE records exist only as evaluation subjects (OJT/Probation/Skill
// Matrix) — they never sign in, so they're excluded from role-switcher UIs.
export const LOGINABLE_ROLES: Role[] = ['ADMIN', 'HR', 'SUPERVISOR'];
