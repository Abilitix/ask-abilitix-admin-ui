// Role-based access control definitions

export type UserRole = 'owner' | 'admin' | 'curator' | 'viewer' | 'guest';

export interface RolePermissions {
  canAccessDashboard: boolean;
  canAccessInbox: boolean;
  canAccessDocs: boolean;
  canAccessSettings: boolean;
  canAccessOnboarding: boolean;
  canAccessDebug: boolean;
  canAccessDemo: boolean;
  canUploadDocs: boolean;
  canManageDocs: boolean;
  canApproveInbox: boolean;
  canManageSettings: boolean;
  canInviteUsers: boolean;
  canViewLogs: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  owner: {
    canAccessDashboard: true,
    canAccessInbox: true,
    canAccessDocs: true,
    canAccessSettings: true,
    canAccessOnboarding: true,
    canAccessDebug: true,
    canAccessDemo: false,
    canUploadDocs: true,
    canManageDocs: true,
    canApproveInbox: true,
    canManageSettings: true,
    canInviteUsers: true,
    canViewLogs: true,
  },
  admin: {
    canAccessDashboard: true,
    canAccessInbox: true,
    canAccessDocs: true,
    canAccessSettings: true,
    canAccessOnboarding: false,
    canAccessDebug: true,
    canAccessDemo: false,
    canUploadDocs: true,
    canManageDocs: true,
    canApproveInbox: true,
    canManageSettings: true,
    canInviteUsers: false,
    canViewLogs: true,
  },
  curator: {
    canAccessDashboard: true,
    canAccessInbox: true,
    canAccessDocs: true,
    canAccessSettings: false,
    canAccessOnboarding: false,
    canAccessDebug: false,
    canAccessDemo: false,
    canUploadDocs: true,
    canManageDocs: true,
    canApproveInbox: true,
    canManageSettings: false,
    canInviteUsers: false,
    canViewLogs: false,
  },
  viewer: {
    canAccessDashboard: true,
    canAccessInbox: false,
    canAccessDocs: true,
    canAccessSettings: false,
    canAccessOnboarding: false,
    canAccessDebug: false,
    canAccessDemo: false,
    canUploadDocs: false,
    canManageDocs: false,
    canApproveInbox: false,
    canManageSettings: false,
    canInviteUsers: false,
    canViewLogs: false,
  },
  guest: {
    canAccessDashboard: false,
    canAccessInbox: false,
    canAccessDocs: true,
    canAccessSettings: false,
    canAccessOnboarding: false,
    canAccessDebug: false,
    canAccessDemo: false,
    canUploadDocs: false,
    canManageDocs: false,
    canApproveInbox: false,
    canManageSettings: false,
    canInviteUsers: false,
    canViewLogs: false,
  },
};

export function hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}

export function getVisibleNavItems(role: UserRole) {
  const permissions = ROLE_PERMISSIONS[role];
  const navItems = [
    { href: "/", label: "Dashboard", permission: "canAccessDashboard" as keyof RolePermissions },
    { href: "/admin/inbox", label: "Inbox", permission: "canAccessInbox" as keyof RolePermissions },
    { href: "/admin/docs", label: "Docs", permission: "canAccessDocs" as keyof RolePermissions },
    { href: "/admin/settings", label: "Settings", permission: "canAccessSettings" as keyof RolePermissions },
    { href: "/admin/rag", label: "Debug", permission: "canAccessDebug" as keyof RolePermissions },
  ];

  return navItems.filter(item => permissions[item.permission]);
}
