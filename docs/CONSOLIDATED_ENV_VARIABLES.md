# 📦 Ask Abilitix — Unified .env Reference

**Last updated:** 23 Oct 2025  
**Status:** Production Environment Variables

---

## 🌐 Vercel Environment (.env.vercel.prod)

### 🔧 Public App Config
```bash
NEXT_PUBLIC_API_BASE=https://ask-abilitix-admin-api.onrender.com
NEXT_PUBLIC_APP_URL=https://app.abilitix.com.au
NEXT_PUBLIC_APP_BASE_URL=https://app.abilitix.com.au
NEXT_PUBLIC_ADMIN_API=https://ask-abilitix-admin-api.onrender.com
NEXT_PUBLIC_API_URL=ENCRYPTED
NEXT_PUBLIC_ASK_BASE=ENCRYPTED
NEXT_PUBLIC_TENANT_SLUG=ENCRYPTED
NEXT_PUBLIC_TW_CDN=ENCRYPTED
NEXT_PUBLIC_SHOW_PILOT_LINK=ENCRYPTED
NEXT_PUBLIC_ENABLE_RAG_NEW=ENCRYPTED
NEXT_PUBLIC_HIDE_OLD_RAG=ENCRYPTED
NEXT_PUBLIC_ENABLE_TUS_UI=ENCRYPTED
NEXT_PUBLIC_ENABLE_VERIFY_PREFLIGHT=ENCRYPTED
NEXT_PUBLIC_RENDER_MARKDOWN=ENCRYPTED
NEXT_PUBLIC_ALLOW_PASSWORD_LOGIN=0
NEXT_PUBLIC_SUPERADMIN_EMAILS=ENCRYPTED
NEXT_PUBLIC_SUSPEND_CLIENT_AUTH=ENCRYPTED
```

### 🔐 Admin API
```bash
ADMIN_API_BASE=https://ask-abilitix-admin-api.onrender.com
ADMIN_API_URL=https://api.abilitix.com.au
ADMIN_API=https://ask-abilitix-admin-api.onrender.com
ADMIN_BASE=https://ask-abilitix-admin-api.onrender.com
ADMIN_API_TOKEN=ENCRYPTED
DEFAULT_TENANT_ID=ENCRYPTED
```

### ⚙️ Runtime API
```bash
ASK_BASE=https://ask-abilitix-runtime.onrender.com
ASK_SSE_ENABLE=ENCRYPTED
```

### 🧬 Supabase
```bash
SUPABASE_URL=ENCRYPTED
SUPABASE_SERVICE_ROLE=ENCRYPTED
```

### 📧 Email & Notifications
```bash
EMAIL_PROVIDER=ENCRYPTED
EMAIL_FROM=ENCRYPTED
MAILTRAP_TOKEN=ENCRYPTED
```

### 🍪 Session & Cookies
```bash
SESSION_TTL_MINUTES=60
COOKIE_NAME=aa_sess
TZ_DEFAULT=Australia/Sydney
```

### 🧪 Debug & Demo
```bash
X_DEBUG_KEY=ENCRYPTED
DEMO_MODE=ENCRYPTED
```

---

## 🔐 Render Admin API (.env.render.admin)

### 🔧 Core App Config
```bash
API_BASE_URL=https://api.abilitix.com.au
APP_BASE_URL=https://app.abilitix.com.au
ADMIN_TOKEN=REDACTED
ADMIN_REEMBED_ON_APPROVE=1
PUBLIC_SIGNUP_ENABLE=1
PUBLIC_SIGNUP_KEY=
```

### 🔐 Auth & Session
```bash
ALLOW_PASSWORD_LOGIN=0
ENABLE_OTP=0
ENABLE_SESSION_CACHE=1
ENABLE_SLIDING_REFRESH=1
SESSION_COOKIE_NAME=aa_sess
SESSION_TTL_HOURS=24
SESSION_TTL_MINUTES=60
SESSION_CACHE_TTL_SECONDS=60
MAGIC_LINK_TTL_MIN=15
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
REQUIRE_EMAIL_VERIFIED=0
SIGNIN_ENABLE=1
```

### 🔒 Argon2 Password Hashing
```bash
ARGON2_HASH_LEN=32
ARGON2_MEMORY_COST=64000
ARGON2_PARALLELISM=2
ARGON2_SALT_LEN=16
ARGON2_TIME_COST=3
```

### 🍪 Cookie & CORS
```bash
COOKIE_NAME=aa_sess
COOKIE_DOMAIN=.abilitix.com.au
COOKIE_SAMESITE=lax
COOKIE_SECURE=1
CORS_ALLOW_ORIGINS=https://ask-abilitix-admin-api.onrender.com
```

### 🧬 Supabase & Database
```bash
DATABASE_URL="postgresql://postgres.atnidggjuzhlcxxnnltn:REDACTED@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require&connect_timeout=10"
PGHOST=aws-0-ap-southeast-2.pooler.supabase.com
PGPORT=6543
PGUSER=postgres.atnidggjuzhlcxxnnltn
PGPASSWORD=REDACTED
PGDATABASE=postgres
PGSSLMODE=require
PG_CONNECT_TIMEOUT_S=10
PG_MAX_CONN=20
DB_CONN_TIMEOUT_S=30
DB_POOL_MAX=5
DB_POOL_MIN=1
DB_STATEMENT_TIMEOUT_MS=10000
SUPABASE_URL=https://atnidggjuzhlcxxnnltn.supabase.co
SUPABASE_JWT_SECRET="REDACTED"
SUPABASE_SERVICE_KEY=REDACTED
```

### 🧠 Redis
```bash
REDIS_URL=rediss://default:REDACTED@nant-panther-63025.upstash.io:6379
```

### 📧 Email (Mailtrap)
```bash
MAIL_PROVIDER=mailtrap
MAILTRAP_API_KEY=REDACTED
MAIL_FROM=<no-reply@abilitix.com.au>
```

### 🤖 LLM & Embeddings
```bash
OPENAI_API_KEY=REDACTED
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIM=1536
LLM_MAX_OUTPUT_TOKENS=500
```

### 🔍 RAG & Search
```bash
RAG_CACHE_ENABLE=1
RAG_TOPK=5
DOC_MIN_SCORE=0.24
DOC_TRGM_W=0.45
DOC_VEC_W=0.55
```

### 📁 Uploads
```bash
UPLOADS_BUCKET=tenant-uploads
UPLOAD_MAX_BYTES=104857600
UPLOAD_ALLOWED_MIMES_JSON='{"application/pdf":"pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document":"docx","image/jpeg":"jpg","image/png":"png","video/mp4":"mp4","video/webm":"webm"}'
UPLOAD_MIME_ALIASES_JSON='{"image/jpg":"image/jpeg","application/x-pdf":"application/pdf"}'
UPLOAD_OBJECT_PREFIX_TEMPLATE=tenants/{tenant_id}/uploads/{uuid}.{ext}
UPLOAD_START_STAGE=extract
UPLOAD_WORKER_PARALLELISM=4
ALLOWED_FILE_TYPES=pdf,txt,docx
```

### 🚦 Rate Limits
```bash
RATE_LIMIT_SIGNIN_PER_MIN=5
RATE_LIMIT_VERIFY_PER_MIN=10
RL_SIGNUP_EMAIL_PER_MIN=5
RL_SIGNUP_IP_PER_MIN=20
```

### ⚠️ Error Handling
```bash
ENABLE_VERIFY_ERROR_REDIRECT=1
ERROR_REDIRECT_BASE=https://app.abilitix.com.au/verify/error
FAIL_OPEN_WITH_CACHE_ON_ERROR=1
```

### 📊 Logging & Runtime
```bash
LOG_JSON=1
WEB_CONCURRENCY=1
```

### 🔁 Redirects
```bash
ALLOWED_REDIRECTS=/,/admin,/admin/docs
```

---

## ⚙️ Render Runtime API (.env.render.runtime)

### 🔧 Core Runtime
```bash
DEFAULT_TENANT_SLUG=abilitix
ROOT_HOST=abilitix.com.au
MICROSITE_MODE=false
WEB_CONCURRENCY=2
UVICORN_WORKERS=2
LOG_LEVEL=INFO
LOG_MATCH=1
X_DEBUG_KEY=ask-abilitix-prod-debug-2025-xyz789-abc123
```

### 🤖 LLM & Embeddings
```bash
MODEL_NAME=gpt-4o-mini
CHAT_MODEL=gpt-4o-mini
SYNTH_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small
OPENAI_API_KEY=REDACTED
OPENAI_TIMEOUT_S=15
LLM_ALLOWED_MODELS=gpt-4o-mini,gpt-4o
LLM_MAX_INPUT_TOKENS=3000
LLM_MAX_OUTPUT_TOKENS_DEFAULT=500
LLM_MAX_OUTPUT_TOKENS_CEILING=1200
LLM_MAX_OUTPUT_TOKENS_FLOOR=50
LLM_DAILY_TOKEN_BUDGET=100000
LLM_ENFORCE=0
LLM_FAIL_OPEN=1
LLM_FASTPATH=1
LLM_NO_STORE=1
LLM_PROXY_SHADOW=1
```

### 🔍 RAG & Retrieval
```bash
RAG_ALPHA=0.6
RAG_TOPK=5
RAG_TOPK_CEILING=12
RAG_CACHE_ENABLE=1
RAG_CACHE_TTL_SECONDS=300
RAG_CAPS=1
ASK_TOPK=6
ASK_MIN_SCORE=0.25
ASK_MMR_LAMBDA=0.7
ASK_MAX_DOCS=3
ASK_MAX_CHUNKS_PER_DOC=2
ASK_REQUIRE_CONTEXT=true
ASK_ENABLE_SYNTH=1
ASK_SSE_ENABLE=1
ASK_DEBUG=0
```

### 🧠 Context & Session
```bash
CTX_ENABLE=1
CTX_SESSION_ENABLE=1
CTX_USER_ENABLE=1
CTX_POLICY_ENABLE=1
CTX_BRAND_INTENT_ENABLE=1
CTX_GLOSSARY_ENABLE=1
CTX_INSERT_PROFILE_DOC=0
CTX_BIAS_PROFILE=0
```

---

## 🔑 Key Configuration Notes

### 🍪 Cookie Configuration
- **Cookie Name:** `aa_sess` (consistent across all services)
- **Cookie Domain:** `.abilitix.com.au` (enables cross-subdomain access)
- **Session TTL:** 60 minutes (1 hour)

### 🌐 API Endpoints
- **Admin API:** `https://ask-abilitix-admin-api.onrender.com`
- **Runtime API:** `https://ask-abilitix-runtime.onrender.com`
- **UI Domain:** `https://app.abilitix.com.au`

### 🔐 Authentication
- **Magic Link Login:** Enabled
- **Password Login:** Disabled (`NEXT_PUBLIC_ALLOW_PASSWORD_LOGIN=0`)
- **Session Management:** Cross-domain cookie support

### 📊 Database & Storage
- **Primary DB:** Supabase PostgreSQL
- **Cache:** Redis (Upstash)
- **File Storage:** Supabase Storage
- **Uploads:** Tenant-scoped bucket structure

---

## 🚨 Security Notes

- All sensitive values are marked as `ENCRYPTED` or `REDACTED`
- Database credentials are properly secured
- API keys are environment-specific
- Cookie security settings are production-ready

---

## 📝 Maintenance

- **Last Updated:** 23 Oct 2025
- **Status:** Production Environment
- **Next Review:** When adding new features or changing infrastructure
