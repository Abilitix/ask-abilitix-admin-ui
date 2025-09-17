import { requireAuth } from '@/lib/auth';
import DashboardClient from '@/components/DashboardClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper function to get flags from server
async function getFlags() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/admin/flags`, { 
      cache: "no-store",
      headers: {
        'Cookie': process.env.COOKIE_DOMAIN ? `domain=${process.env.COOKIE_DOMAIN}` : ''
      }
    });
    if (!res.ok) return { ui_v2_enabled: false };
    return res.json();
  } catch (error) {
    console.error('Failed to fetch flags:', error);
    return { ui_v2_enabled: false };
  }
}

export default async function Page() {
  const user = await requireAuth();
  const { ui_v2_enabled } = await getFlags();
  
  return <DashboardClient user={user} ui_v2_enabled={ui_v2_enabled} />;
}