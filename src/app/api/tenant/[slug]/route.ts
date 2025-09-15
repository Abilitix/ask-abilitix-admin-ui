import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Tenant slug is required' },
        { status: 400 }
      );
    }

    // For now, return basic tenant info without Admin API call
    // This can be enhanced later when we have proper tenant management
    return NextResponse.json({
      id: slug,
      slug: slug,
      name: `Tenant ${slug}`,
      type: 'pilot'
    }, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' }
    });

  } catch (error) {
    console.error('Tenant fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
