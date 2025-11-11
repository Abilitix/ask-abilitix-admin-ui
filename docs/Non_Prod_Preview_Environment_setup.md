# Non-Prod Preview Environment Setup

This note captures the additional configuration required to run the Admin UI safely in a Vercel **Preview** deployment (`ask-abilitix-admin-ui.vercel.app`). It summarises the code changes introduced for PR2 and highlights the environment variables that must be set before testing.

---

## 1. Environment Variables

All preview-specific values live alongside the existing production variables in Vercel. Prefetch the following keys in the **Preview** scope:

| Variable | Purpose | Example |
| --- | --- | --- |
| `PREVIEW_ADMIN_API` | Admin API base URL used by the UI proxy routes | `https://ask-abilitix-admin-api-preview.onrender.com` |
| `PREVIEW_APP_URL` | Canonical URL for the preview UI, used for post-login redirects | `https://ask-abilitix-admin-ui.vercel.app` |
| `PREVIEW_COOKIE_DOMAIN` | Cookie domain for preview sessions (host-only) | `ask-abilitix-admin-ui.vercel.app` |
| `PREVIEW_SUPERADMIN_EMAILS` _(optional)_ | Override list of superadmin accounts for preview | `alice@abilitix.com.au,bob@abilitix.com.au` |
| `PREVIEW_LOGIN_PROXY` | Enable `/api/public/verify` cookie proxy for preview deployments | `1` |

The existing production keys (`ADMIN_API`, `NEXT_PUBLIC_APP_URL`, `COOKIE_DOMAIN`, etc.) remain untouched and continue to power the production environment.

> **Security note:** Preview cookies are scoped to the preview host only. Attempts to set them to `.abilitix.com.au` will now fail fast.

---

## 2. Code Behaviour Changes (Preview-Safe)

1. **Central Env Helper**
   - `src/lib/env.ts` exposes `getAdminApiBase`, `getAppUrl`, and `getCookieDomain`.
   - Preview variables take precedence. Runtime validation ensures preview cookies never leak to the production domain.

2. **Server Routes & Middleware**
   - All server routes now rely on `getAdminApiBase()` rather than reading `process.env.ADMIN_API` directly.
   - The middleware keeps its existing behaviour but leverages the shared helper to avoid hard-coded URLs.

3. **Cookie Handling**
   - `/api/auth/login` and `/api/auth/logout` set the session cookie using `getCookieDomain(hostname)`.
   - If `PREVIEW_COOKIE_DOMAIN` is misconfigured (e.g., points to prod), the helper throws to prevent session leakage.

4. **Magic Link Flow**
   - `/verify` no longer constructs Admin API URLs in the browser. It now relies on the server proxy `/api/public/verify`, which chooses the correct Admin API based on environment.

5. **Logging**
   - Debug logging that previously printed request payloads has been removed to avoid leaking PII in preview logs.

6. **Superadmin CSV Parsing**
   - `PREVIEW_SUPERADMIN_EMAILS` and `NEXT_PUBLIC_SUPERADMIN_EMAILS` are now trimmed and filtered to avoid accidental empty entries.

All changes are additive and do not modify the production behaviour.

---

## 3. Preview Smoke Test Checklist

After deploying the `preview` branch to Vercel:

1. **Magic Link Login**
   - Request a magic link on the preview domain.
   - Ensure the email link points to `ask-abilitix-admin-ui.vercel.app/public/verify?token=...`.
   - Follow the link and confirm it does not bounce to `app.abilitix.com.au`.

2. **Email/Password Login (if enabled)**
   - Sign in via `/signin`. The `aa_sess` cookie should be scoped to `ask-abilitix-admin-ui.vercel.app`.

3. **Admin API Calls**
   - Use the browser devtools “Network” tab or call `/api/debug/auth`. Responses should show requests proxied to `PREVIEW_ADMIN_API`.

4. **Feature Flag Check**
   - Ensure the Inbox UI renders only when the backend returns the PR2 payload shape. The preview deployment should still be feature-flagged by the Admin API.

5. **Sign Out**
   - Invoke the “Sign out” button and confirm the session cookie is cleared on the preview domain.

Document any anomalies before promoting the preview build to `main`.

---

## 4. Promotion Considerations

1. Merge the `preview` branch into `main` only after the preview smoke tests pass.
2. Set the corresponding production environment variables (`ADMIN_API`, `NEXT_PUBLIC_APP_URL`, `COOKIE_DOMAIN`) before promoting the Vercel deployment.
3. Coordinate with the Admin API team to ensure their preview environment respects the same cookie-domain and redirect settings.

With this setup, the preview environment is isolated from production, and the PR2 changes can be safely validated end-to-end.

