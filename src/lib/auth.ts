import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { hasPermission, type UserRole } from './roles';

export interface User {
  tenant_id: string;
  tenant_slug: string;        // ← NEW FIELD
  tenant_name: string;        // ← NEW FIELD
  user_id: string;
  email: string;
  role: 'owner' | 'admin' | 'curator' | 'viewer';
  expires_at: string;
}

export async function getAuthUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    
    if (!cookieHeader) {
      return null;
    }

    const response = await fetch(`${process.env.ADMIN_API}/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      return await response.json();
    }

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
