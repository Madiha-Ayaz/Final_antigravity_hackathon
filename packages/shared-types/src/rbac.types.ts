export type Role = 'user' | 'moderator' | 'admin' | 'superadmin';

export type Permission =
  // User permissions
  | 'user:read'
  | 'user:update'
  | 'user:delete'
  // Emergency permissions
  | 'emergency:create'
  | 'emergency:read'
  | 'emergency:cancel'
  // Validator permissions
  | 'validator:submit'
  | 'validator:read'
  // Reputation permissions
  | 'reputation:read'
  | 'reputation:update'
  // Moderation permissions
  | 'moderation:ban'
  | 'moderation:unban'
  | 'moderation:review'
  // Admin permissions
  | 'admin:users'
  | 'admin:analytics'
  | 'admin:settings'
  | 'admin:audit'
  // System permissions
  | 'system:config'
  | 'system:logs'
  | 'system:backup';

export interface RolePermissions {
  role: Role;
  permissions: Permission[];
  description: string;
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  user: [
    'user:read',
    'user:update',
    'emergency:create',
    'emergency:read',
    'emergency:cancel',
    'validator:submit',
    'validator:read',
    'reputation:read',
  ],
  moderator: [
    'user:read',
    'user:update',
    'emergency:create',
    'emergency:read',
    'emergency:cancel',
    'validator:submit',
    'validator:read',
    'reputation:read',
    'reputation:update',
    'moderation:ban',
    'moderation:unban',
    'moderation:review',
  ],
  admin: [
    'user:read',
    'user:update',
    'user:delete',
    'emergency:create',
    'emergency:read',
    'emergency:cancel',
    'validator:submit',
    'validator:read',
    'reputation:read',
    'reputation:update',
    'moderation:ban',
    'moderation:unban',
    'moderation:review',
    'admin:users',
    'admin:analytics',
    'admin:settings',
    'admin:audit',
  ],
  superadmin: [
    'user:read',
    'user:update',
    'user:delete',
    'emergency:create',
    'emergency:read',
    'emergency:cancel',
    'validator:submit',
    'validator:read',
    'reputation:read',
    'reputation:update',
    'moderation:ban',
    'moderation:unban',
    'moderation:review',
    'admin:users',
    'admin:analytics',
    'admin:settings',
    'admin:audit',
    'system:config',
    'system:logs',
    'system:backup',
  ],
};

export const ROLE_HIERARCHY: Record<Role, number> = {
  user: 1,
  moderator: 2,
  admin: 3,
  superadmin: 4,
};
