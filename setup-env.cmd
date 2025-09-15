@echo off
echo Creating .env.local file...
echo # Client + Server (safe to expose to browser) > .env.local
echo NEXT_PUBLIC_ASK_BASE=https://ask-abilitix-api.onrender.com >> .env.local
echo NEXT_PUBLIC_TENANT_SLUG=abilitix >> .env.local
echo NEXT_PUBLIC_APP_URL=https://ask-abilitix-admin-ui.vercel.app >> .env.local
echo. >> .env.local
echo # Server-only (DO NOT expose to client) >> .env.local
echo ADMIN_BASE=https://ask-abilitix-admin-api.onrender.com >> .env.local
echo ASK_BASE=https://ask-abilitix-api.onrender.com >> .env.local
echo COOKIE_NAME=aa_sess >> .env.local
echo ADMIN_TOKEN=IoOg5yrZe3zZCg7SP3-esyyQWhwhK31-19f6lHDlij4kafMEAJ9PNne7eHOqlYbQ >> .env.local
echo TENANT_ID=a2fa67c0-d0e5-42db-8d5a-845637190732 >> .env.local
echo PUBLIC_SIGNUP_KEY=your_signup_key_here >> .env.local
echo. >> .env.local
echo Environment file created successfully!

