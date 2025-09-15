import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export interface User {
  tenant_id: string;
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

    const response = await fetch(`${process.env.ADMIN_BASE}/auth/me`, {
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
  return ['owner', 'admin'].includes(role);
}

export function canManageDocs(role: string): boolean {
  return ['owner', 'admin', 'curator'].includes(role);
}

export function canManageSettings(role: string): boolean {
  return ['owner', 'admin'].includes(role);
}
