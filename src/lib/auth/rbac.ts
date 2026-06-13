export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN:       "ADMIN",
  STUDENT:     "STUDENT",
} as const;

export type Role = keyof typeof ROLES;

const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 3,
  ADMIN:       2,
  STUDENT:     1,
};

export function hasMinimumRole(userRole: string, minimumRole: Role): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[minimumRole] ?? 0);
}

export function isRole(userRole: string, role: Role): boolean {
  return userRole === role;
}
