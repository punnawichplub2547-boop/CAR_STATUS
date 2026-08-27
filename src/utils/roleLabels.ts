import type { Role } from '../types';

// Thai display labels for each Role value — used anywhere a role badge or
// role-switcher list is rendered (Navbar, TestLoginModal).
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'แอดมิน',
  HR: 'HR',
  SUPERVISOR: 'หัวหน้าแผนกอาวุโส',
  EMPLOYEE: 'พนักงาน',
};

// Roles available in quick demo login/switcher UIs so admins/testers can test all role views.
export const LOGINABLE_ROLES: Role[] = ['ADMIN', 'HR', 'SUPERVISOR', 'EMPLOYEE'];
