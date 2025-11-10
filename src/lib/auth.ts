import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { hasPermission, type UserRole } from './roles';
import { getAdminApiBase } from '@/lib/env';

export interface User {
  tenant_id: string;
  tenant_slug: string;        // ← NEW FIELD
  tenant_name: string;        // ← NEW FIELD
  user_id: string;
  email: string;
  role: 'owner' | 'admin' | 'curator' | 'viewer';
  expires_at: string;
}

function parseEmailCsv(list?: string | null): string[] {
  return list
    ? list
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    : [];
}

function getSuperadminEmails(): string[] {
  const previewEmails = parseEmailCsv(process.env.PREVIEW_SUPERADMIN_EMAILS);
  if (previewEmails.length > 0) {
    return previewEmails;
  }
  return parseEmailCsv(process.env.NEXT_PUBLIC_SUPERADMIN_EMAILS);
}

export async function getAuthUser(h?: Headers): Promise<User | null> {
  try {
    const adminApi = getAdminApiBase();
    const cookie = h?.get("cookie") ?? (await (await import("next/headers")).cookies()).toString();

    const r = await fetch(`${adminApi}/auth/me`, {
      headers: cookie ? { Cookie: cookie } : {},
      cache: "no-store",
      redirect: "manual",
    });
    
    if (r.status === 200) return r.json();
    if (r.status === 401) return null;   // don't throw → prevents random 500→signin
    return null;
  } catch (error) {
    console.error('Auth check error:', error);
    return null;
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getAuthUser();
  
  if (!user) {
    redirect('/signin');
  }
  
  return user;
}

export async function requireAdminAuth(): Promise<User> {
  const user = await requireAuth();
  
  if (!['owner', 'admin'].includes(user.role)) {
    redirect('/admin/docs?error=insufficient_permissions');
  }
  
  return user;
}

export function isAdminRole(role: string): boolean {
  return hasPermission(role as UserRole, 'canManageSettings');
}

export function canManageDocs(role: string): boolean {
  return hasPermission(role as UserRole, 'canManageDocs');
}

export function canManageSettings(role: string): boolean {
  return hasPermission(role as UserRole, 'canManageSettings');
}

export function canUploadDocs(role: string): boolean {
  return hasPermission(role as UserRole, 'canUploadDocs');
}

export function canApproveInbox(role: string): boolean {
  return hasPermission(role as UserRole, 'canApproveInbox');
}

export async function requireSuperadminAuth(): Promise<User> {
  const user = await requireAuth();
  
  // Check if user email is in superadmin list (server-side)
  const SUPERADMIN_EMAILS = getSuperadminEmails();
  const isSuperAdmin = SUPERADMIN_EMAILS.includes(user.email);
  
  if (!isSuperAdmin) {
    redirect('/admin/docs?error=insufficient_permissions');
  }
  
  return user;
}

export function isSuperadmin(email: string): boolean {
  const SUPERADMIN_EMAILS = getSuperadminEmails();
  return SUPERADMIN_EMAILS.includes(email);
}
