import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { detail: { code: 'MISSING_CREDENTIALS', message: 'Email and password are required' } },
        { status: 400 }
      );
    }

    // Get Admin API base URL from environment
    const adminApiBase = process.env.ADMIN_API_BASE;
    if (!adminApiBase) {
      console.error('ADMIN_API_BASE environment variable not set');
      return NextResponse.json(
        { detail: { code: 'CONFIGURATION_ERROR', message: 'Server configuration error - ADMIN_API_BASE not set' } },
        { status: 500 }
      );
    }

    // Forward the login request to the Admin API
    const response = await fetch(`${adminApiBase}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // Forward credentials to Admin API
    });

    const data = await response.json();

    if (response.ok) {
      // Success - extract session cookie from Admin API response
      const sessionCookie = response.headers.get('set-cookie');
      
      if (sessionCookie) {
        // Create response with the session cookie
        const nextResponse = NextResponse.json(data, { status: 200 });
        
        // Parse and set the session cookie
        const cookieParts = sessionCookie.split(';');
        const cookieNameValue = cookieParts[0];
        const cookieOptions: any = {};
        
        // Parse cookie options
        cookieParts.slice(1).forEach(part => {
          const [key, value] = part.trim().split('=');
          switch (key.toLowerCase()) {
            case 'httponly':
              cookieOptions.httpOnly = true;
              break;
            case 'samesite':
              cookieOptions.sameSite = value?.toLowerCase() || 'lax';
              break;
            case 'secure':
              cookieOptions.secure = true;
              break;
            case 'max-age':
              cookieOptions.maxAge = parseInt(value) || 3600;
              break;
            case 'path':
              cookieOptions.path = value || '/';
              break;
          }
        });

        // Set the session cookie
        nextResponse.cookies.set('abilitix_s', cookieNameValue.split('=')[1], {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 3600, // 1 hour
          path: '/',
          ...cookieOptions
        });

        return nextResponse;
      } else {
        // No session cookie in response - this shouldn't happen
        console.error('No session cookie received from Admin API');
        return NextResponse.json(
          { detail: { code: 'SESSION_ERROR', message: 'Failed to establish session' } },
          { status: 500 }
        );
      }
    } else {
      // Forward the error response from Admin API
      return NextResponse.json(data, { status: response.status });
    }
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { detail: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
