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

    // Debug logging for upload issues
    console.log('File Upload Debug:', {
      fileName: file.name,
      fileSize: file.size,
      title: title,
      cookieHeader: req.headers.get('cookie')?.substring(0, 50) + '...'
    });

    // Create new FormData for Admin API
    const adminFormData = new FormData();
    adminFormData.append('file', file);
    if (title) {
      adminFormData.append('title', title);
    }

    // Forward cookies for session-based authentication
    const cookieHeader = req.headers.get('cookie') || '';
    const ADMIN_API = process.env.ADMIN_API;

    if (!ADMIN_API) {
      return NextResponse.json({ error: 'ADMIN_API not configured' }, { status: 500 });
    }

    // Call Admin API with better error handling
    const response = await fetch(`${ADMIN_API}/admin/docs/upload_file`, {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader,
      },
      body: adminFormData,
    });

    // Handle response more robustly
    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch (jsonError) {
        // Handle non-JSON responses (like HTML error pages)
        const textResponse = await response.text();
        console.error('Admin API returned non-JSON response:', {
          status: response.status,
          statusText: response.statusText,
          response: textResponse.substring(0, 500)
        });
        return NextResponse.json(
          { error: 'Admin API error', details: textResponse.substring(0, 500) },
          { status: response.status }
        );
      }
      
      console.error('Admin API upload error:', {
        status: response.status,
        statusText: response.statusText,
        errorData: errorData
      });
      
      return NextResponse.json(errorData, { status: response.status });
    }

    // Success case
    let data: any = {};
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse successful response as JSON:', jsonError);
      return NextResponse.json(
        { error: 'Invalid response format' },
        { status: 500 }
      );
    }

    console.log('File upload successful:', { fileName: file.name, title: title });
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
