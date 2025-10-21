# Email+Password Login Setup

## Environment Variables

Add these environment variables to enable the Email+Password login feature:

```env
# Feature Flag - Enable Email+Password Login
NEXT_PUBLIC_ALLOW_PASSWORD_LOGIN=1

# Admin API Configuration (if not already set)
ADMIN_API_BASE=https://your-admin-api.com
ADMIN_API_TOKEN=your-admin-api-token

# Session Configuration (optional - defaults provided)
SESSION_COOKIE_NAME=abilitix_s
SESSION_TTL_MINUTES=60
```

## Feature Flag Control

The Email+Password login form is controlled by the `NEXT_PUBLIC_ALLOW_PASSWORD_LOGIN` environment variable:

- `NEXT_PUBLIC_ALLOW_PASSWORD_LOGIN=1` - Shows both Email+Password form and Magic Link
- `NEXT_PUBLIC_ALLOW_PASSWORD_LOGIN=0` or unset - Shows only Magic Link (default)

## Implementation Details

### Components Created

1. **`EmailPasswordForm`** (`src/components/auth/EmailPasswordForm.tsx`)
   - Email and password input fields
   - Real-time password strength validation
   - Error handling for all API error codes
   - Loading states and success handling

2. **API Route** (`src/app/api/auth/login/route.ts`)
   - Proxies login requests to Admin API
   - Handles session cookie management
   - Forwards error responses appropriately

3. **Updated Signin Page** (`src/app/signin/page.tsx`)
   - Feature flag gating
   - Clean UI with "or" separator
   - Maintains existing Magic Link functionality

### Password Requirements

The form enforces these password requirements (configurable via backend feature flags):

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one symbol (!@#$%^&*()_+-=[]{}|;:,.<>?)

### Error Handling

The form handles these specific error codes:

- `INVALID_CREDENTIALS` - Generic "Invalid email or password"
- `EMAIL_NOT_VERIFIED` - Shows verification message with resend option
- `NO_TENANT_ACCESS` - Shows contact admin message
- `rate_limited` - Shows "Too many attempts, try again later"
- Network errors - Shows "Unable to connect, please try again"

### Session Management

- Session cookie: `abilitix_s` (HttpOnly, SameSite=Lax, 60min TTL)
- Success flow: Set cookie → redirect to `/admin`
- Cookie configuration matches Admin API settings

## Testing

Run the test suite to verify functionality:

```bash
npm test src/components/auth/__tests__/EmailPasswordForm.test.tsx
```

## Deployment

1. Set `NEXT_PUBLIC_ALLOW_PASSWORD_LOGIN=1` in your environment
2. Ensure `ADMIN_API_BASE` points to your Admin API
3. Deploy the updated code
4. Test the login flow in production

## Rollback

To disable Email+Password login:

1. Set `NEXT_PUBLIC_ALLOW_PASSWORD_LOGIN=0` or remove the variable
2. Redeploy - users will only see Magic Link option
3. No code changes required for rollback
