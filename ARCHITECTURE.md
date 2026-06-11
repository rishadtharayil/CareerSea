# 🏗️ System Architecture: CareerSea

This document outlines the technical infrastructure and data flow of the CareerSea platform.

## 💾 Infrastructure Stack
- **Frontend:** React 19 + Tailwind CSS (Vite), deployed on **Google Cloud Run**.
- **Backend:** Django 6 + Django REST Framework, deployed on **Google Cloud Run**.
- **Database:** PostgreSQL (Managed by **Supabase**), connected via Direct TCP (Port 5432).
- **Secrets:** **Google Cloud Secret Manager**.
- **CI/CD:** **GitHub Actions** using Workload Identity Federation (WIF).
- **AI Engine (Primary):** Google Vertex AI — Gemini 2.0 Flash (`gemini-2.0-flash-001`) via `google-cloud-aiplatform` SDK. Authenticated via Cloud Run service-account identity (no API key).
- **AI Engine (Fallback):** OpenRouter API — controlled by `AI_PROVIDER=openrouter` env var. Model configurable via `OPENROUTER_MODEL`. Key stored in Secret Manager.
- **HTTP Client:** Centralized `api.js` axios instance (frontend) with automatic JWT access-token refresh on 401.

## 🔄 Deployment Pipeline
1.  **Local Dev:** Code is tested locally using SQLite.
2.  **Git Push:** Push to `main` branch triggers `.github/workflows/deploy.yml`.
3.  **Build:** Cloud Build creates Docker images for frontend/backend.
4.  **Security:** Secrets are injected from Secret Manager.
5.  **Traffic:** Cloud Run creates a new revision and shifts 100% traffic.

## 📊 Data Models
### User
- Standard Django User model for Authentication.
### Question
- Represents a diagnostic assessment question.
### UserResponse
- Links a User to their specific answers.
### CareerSuggestion
- The high-level career path suggested by the AI.
### RoadmapStep
- The specific, sequential steps required to achieve the career goal.

## 🔒 Security Posture
- **SSL:** Enforced via `SECURE_SSL_REDIRECT`.
- **HSTS:** 1-year duration enabled.
- **RLS:** Enabled on all Supabase tables to block external REST API access.
- **Rate Limiting:** Scoped throttling on the `/api/submit/` endpoint (2/min burst, 10/day sustained).
- **Permissions:** `DEFAULT_PERMISSION_CLASSES = IsAuthenticatedOrReadOnly`. Public endpoints (`/api/submit/`, `/api/register/`, `/api/questions/`) declare `AllowAny` explicitly. `/api/history/` declares `IsAuthenticated` explicitly.
- **JWT Refresh:** Frontend `api.js` interceptor automatically refreshes the access token on 401 and retries the original request; clears storage and redirects to `/login` if refresh also fails.
- **AI Provider Switch:** Set `AI_PROVIDER=vertex` (default) or `AI_PROVIDER=openrouter` to toggle providers without a code change.
