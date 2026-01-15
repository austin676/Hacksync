// Role-Based Access Control (RBAC) middleware and utilities

import type { UserRole } from "./types"

// Define permissions for each role
export const rolePermissions: Record<UserRole, string[]> = {
  user: ["transaction:create", "transaction:read:own", "profile:read:own"],
  admin: [
    "transaction:create",
    "transaction:read:own",
    "transaction:read:all",
    "transaction:approve",
    "transaction:reject",
    "audit:read",
    "profile:read:own",
    "profile:read:all",
    "user:manage",
  ],
  auditor: ["transaction:read:all", "audit:read", "profile:read:all"],
}

// Check if a role has a specific permission
export function hasPermission(role: UserRole, permission: string): boolean {
  return rolePermissions[role]?.includes(permission) || false
}

// Check if a role has any of the specified permissions
export function hasAnyPermission(role: UserRole, permissions: string[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission))
}

// Check if a role has all of the specified permissions
export function hasAllPermissions(role: UserRole, permissions: string[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission))
}

// Get all permissions for a role
export function getPermissions(role: UserRole): string[] {
  return rolePermissions[role] || []
}
