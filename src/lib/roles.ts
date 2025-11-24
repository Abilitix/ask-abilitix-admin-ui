// Role-based access control definitions

export type UserRole = 'owner' | 'admin' | 'curator' | 'viewer' | 'guest';

export interface RolePermissions {
  canAccessDashboard: boolean;
  canAccessInbox: boolean;
  canAccessDocs: boolean;
  canAccessFAQs: boolean;
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
    canAccessFAQs: true,
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
    canAccessFAQs: true,
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
    canAccessFAQs: true,
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
    canAccessDashboard: false, // Hide dashboard for viewers
    canAccessInbox: false,
    canAccessDocs: false, // Hide docs management for viewers
    canAccessFAQs: false,
    canAccessSettings: false,
    canAccessOnboarding: false,
    canAccessDebug: true, // Allow Test Chat access
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
    canAccessFAQs: false,
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

export function getVisibleNavItems(role: UserRole, isMobile: boolean = false, userEmail?: string) {
  const permissions = ROLE_PERMISSIONS[role];
  
  // Special handling for viewers - only show AI Assistant
  if (role === 'viewer') {
    return [
      { href: "/admin/ai", label: "AI Assistant", permission: "canAccessDebug" as keyof RolePermissions, mobileVisible: true }
    ];
  }
  
  const navItems = [
    { href: "/", label: "Dashboard", permission: "canAccessDashboard" as keyof RolePermissions, mobileVisible: true },
    { href: "/admin/inbox", label: "Inbox", permission: "canAccessInbox" as keyof RolePermissions, mobileVisible: true },
    { href: "/admin/docs", label: "Docs", permission: "canAccessDocs" as keyof RolePermissions, mobileVisible: true },
    { href: "/admin/faqs", label: "FAQ Management", permission: "canAccessFAQs" as keyof RolePermissions, mobileVisible: true },
    { href: "/admin/settings", label: "Settings", permission: "canAccessSettings" as keyof RolePermissions, mobileVisible: false },
    { href: "/admin/ai", label: "AI Assistant", permission: "canAccessDebug" as keyof RolePermissions, mobileVisible: false },
    { href: "/pilot", label: "Pilot", permission: "canAccessDashboard" as keyof RolePermissions, mobileVisible: false },
  ];

  // Add superadmin-only pages (email-based check)
  if (userEmail && typeof window !== 'undefined') {
    const SUPERADMIN_EMAILS = process.env.NEXT_PUBLIC_SUPERADMIN_EMAILS?.split(',') ?? [];
    const isSuperAdmin = SUPERADMIN_EMAILS.includes(userEmail);
    
    if (isSuperAdmin) {
      navItems.push(
        { href: "/admin/governance", label: "Governance", permission: "canAccessSettings" as keyof RolePermissions, mobileVisible: false },
        { href: "/admin/superadmin", label: "Superadmin", permission: "canAccessSettings" as keyof RolePermissions, mobileVisible: false }
      );
    }
  }

  return navItems.filter(item => {
    // Check permission first
    if (!permissions[item.permission]) return false;
    
    // For mobile, only show mobileVisible items
    if (isMobile) return item.mobileVisible;
    
    // For PC, show all items with permission
    return true;
  });
}
