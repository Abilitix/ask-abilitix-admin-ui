import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (15MB limit)
    const maxSize = 15 * 1024 * 1024; // 15MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 15MB)' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['.pdf', '.txt', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: .pdf, .txt, .docx' }, { status: 400 });
    }

    // Create new FormData for Admin API
    const adminFormData = new FormData();
    adminFormData.append('file', file);
    if (title) {
      adminFormData.append('title', title);
    }

    // Forward cookies for session-based authentication
    const cookieHeader = req.headers.get('cookie') || '';

    // Call Admin API
    const response = await fetch(`${process.env.ADMIN_API}/admin/docs/upload_file`, {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader,
      },
      body: adminFormData,
    });

    let data: any = {};
    try {
      data = await response.json();
    } catch (jsonError) {
      // Handle non-JSON responses (like HTML error pages)
      const textResponse = await response.text();
      console.error('Admin API returned non-JSON response:', textResponse);
      return NextResponse.json(
        { error: 'Admin API error', details: textResponse },
        { status: response.status }
      );
    }

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
