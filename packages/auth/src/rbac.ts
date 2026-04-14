import type { UserRole, Permission } from '@aaos/types';

// ─── Permission matrix ──────────────────────

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: ['admin:all', 'team:invite', 'leads:read', 'leads:write', 'leads:delete', 'conversations:read', 'conversations:write', 'workflows:read', 'workflows:write', 'workflows:create', 'workflows:delete', 'workflows:publish', 'clients:read', 'clients:write', 'clients:delete', 'billing:read', 'billing:write', 'analytics:read', 'settings:read', 'settings:write', 'templates:read', 'templates:write'],
  ORGANIZATION_OWNER: ['team:invite', 'leads:read', 'leads:write', 'leads:delete', 'conversations:read', 'conversations:write', 'workflows:read', 'workflows:write', 'workflows:create', 'workflows:delete', 'workflows:publish', 'clients:read', 'clients:write', 'clients:delete', 'billing:read', 'billing:write', 'analytics:read', 'settings:read', 'settings:write', 'templates:read', 'templates:write'],
  ORGANIZATION_ADMIN: ['team:invite', 'leads:read', 'leads:write', 'conversations:read', 'conversations:write', 'workflows:read', 'workflows:write', 'workflows:create', 'workflows:delete', 'clients:read', 'clients:write', 'analytics:read', 'settings:read', 'templates:read', 'templates:write'],
  OPERATOR: ['leads:read', 'leads:write', 'conversations:read', 'conversations:write', 'workflows:read', 'clients:read', 'analytics:read', 'templates:read'],
  CLIENT_ADMIN: ['leads:read', 'conversations:read', 'analytics:read', 'settings:read'],
  CLIENT_USER: ['leads:read', 'conversations:read'],
};

export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = getPermissionsForRole(role);
  return permissions.includes('admin:all') || permissions.includes(permission);
}

export function requirePermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new AuthorizationError(
      `Role '${role}' does not have permission '${permission}'`,
    );
  }
}

export function canAccessOrganization(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'OPERATOR'].includes(role);
}

export function canManageClients(role: UserRole): boolean {
  return hasPermission(role, 'clients:write');
}

export function canPublishWorkflows(role: UserRole): boolean {
  return hasPermission(role, 'workflows:publish');
}

export function isAgencyRole(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'OPERATOR'].includes(role);
}

export function isClientRole(role: UserRole): boolean {
  return ['CLIENT_ADMIN', 'CLIENT_USER'].includes(role);
}

// ─── Error types ───────────────────────────

export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  statusCode = 403;
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class TenantError extends Error {
  statusCode = 403;
  constructor(message = 'Access to this resource is not allowed') {
    super(message);
    this.name = 'TenantError';
  }
}

// ─── Tenant guards ─────────────────────────

/**
 * Verify that a resource's organizationId matches the requester's organization.
 * Throws TenantError if there's a mismatch.
 */
export function assertTenantAccess(
  requesterOrgId: string,
  resourceOrgId: string,
  isSuperAdmin = false,
): void {
  if (isSuperAdmin) return;
  if (requesterOrgId !== resourceOrgId) {
    throw new TenantError();
  }
}

export { ROLE_PERMISSIONS };
export type { UserRole, Permission };
