# 🏗️ System Architecture: CareerSea

This document outlines the technical infrastructure and data flow of the CareerSea platform.

## 💾 Infrastructure Stack
- **Frontend:** React 19 + Tailwind CSS (Vite), deployed on **Google Cloud Run**.
- **Backend:** Django 6 + Django REST Framework, deployed on **Google Cloud Run**.
- **Database:** PostgreSQL (Managed by **Supabase**), connected via Direct TCP (Port 5432).
- **Secrets:** **Google Cloud Secret Manager**.
- **CI/CD:** **GitHub Actions** using Workload Identity Federation (WIF).
- **AI Engine:** Gemini/Claude models via **OpenRouter API**.

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
- **Rate Limiting:** Scoped throttling on the `/api/submit/` endpoint.
