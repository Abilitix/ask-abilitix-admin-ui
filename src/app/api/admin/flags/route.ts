import { NextRequest, NextResponse } from 'next/server';
import { adminGet } from '@/lib/api/admin';

export async function GET(request: NextRequest) {
  try {
    // Get tenant settings to check for ui_v2_enabled flag
    const response = await adminGet('/admin/tenants/settings', request);
    
    if (!response.ok) {
      // If settings endpoint fails, default to false
      return NextResponse.json({ ui_v2_enabled: false });
    }
    
    const settings = await response.json();
    
    // Check if ui_v2_enabled is set in tenant settings
    // Default to false if not present
    const ui_v2_enabled = settings?.ui_v2_enabled === true;
    
    return NextResponse.json({ 
      ui_v2_enabled,
      // Include correlation ID if provided
      ...(request.nextUrl.searchParams.get('rid') && { 
        rid: request.nextUrl.searchParams.get('rid') 
      })
    });
    
  } catch (error) {
    console.error('[/api/admin/flags] Error fetching flags:', error);
    
    // On any error, default to false for safety
    return NextResponse.json({ 
      ui_v2_enabled: false,
      error: 'Failed to fetch flags'
    });
  }
}
