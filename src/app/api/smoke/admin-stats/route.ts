import { NextResponse } from 'next/server';
import { adminGet } from '@/lib/api/admin';

export async function GET() {
  try {
    const stats = await adminGet<{
      total: number;
      with_vec: number;
      missing_vec: number;
    }>('/admin/docs/stats');
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Admin stats smoke test failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

