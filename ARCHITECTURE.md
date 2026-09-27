# 🏗️ System Architecture: CareerSea

This document outlines the technical infrastructure and data flow of the CareerSea platform.

## 💾 Infrastructure Stack
- **Frontend:** React 19 + Tailwind CSS (Vite), deployed on **Cloudflare Pages** (Global Edge CDN with SPA `_redirects`).
- **Backend:** High-performance **Cloudflare Worker** (TypeScript + Hono Edge Framework), deployed at 300+ edge locations.
- **Database:** PostgreSQL (Managed by **Supabase**), queried via Supabase PostgREST HTTPS Client using the Service Role Key (eliminates connection pool exhaustion).
- **Secrets:** **Cloudflare Worker Secrets** (`wrangler secret put`).
- **CI/CD:** **GitHub Actions** deploying via `cloudflare/wrangler-action@v3`.
- **AI Engine (Primary):** Google AI Studio — Gemini 3.1 Flash Lite (`gemini-3.1-flash-lite`) via direct HTTPS `fetch()`.
- **AI Engine (Fallback):** OpenRouter API — controlled by `AI_PROVIDER=openrouter` env var. Model configurable via `OPENROUTER_MODEL`.
- **HTTP Client:** Centralized `api.js` axios instance (frontend). Attaches the Supabase access token and, on 401, refreshes the session once and retries.

## 🔄 Deployment Pipeline
1. **Local Dev:**
   - Frontend: Vite dev server (`http://localhost:5173`)
   - Worker: Local Wrangler runner (`http://localhost:8787`)
2. **Git Push:** Push to `main` branch triggers `.github/workflows/deploy-cloudflare.yml`.
3. **Build & Deploy:**
   - Worker: Bundled and published to Cloudflare global network via Wrangler CLI.
   - Frontend: Vite builds static bundle to `frontend/dist` and deploys to Cloudflare Pages.
4. **Custom Domains:**
   - `careersea.in` -> Cloudflare Pages (Frontend SPA)
   - `api.careersea.in` -> Cloudflare Worker (Backend API)

## 📊 Data Models
### User
- Accounts live in Supabase Auth (`auth.users`), keyed by UUID. The browser signs in with `supabase-js`; the Worker validates the returned access token.
- ⚠️ **Email-based login.** Supabase Auth requires an email for every account, so the login field is EMAIL rather than USERNAME. Password reset requires SMTP to be configured — the default Supabase mailer is rate-limited to team members only.
### Question (`api_question`)
- Represents diagnostic assessment questions.
### UserResponse (`api_userresponse`)
- Links a User to their specific answers.
### CareerSuggestion (`api_careersuggestion`)
- High-level career avenue suggested by the AI (`mainstream`, `adjacent`, `wildcard`).
### RoadmapStep (`api_roadmapstep`)
- Sequential steps/milestones required to achieve the career goal, including on-demand `deep_dive` study guides.
### ChatMessage (`api_chatmessage`)
- Threaded conversation history between the user and the AI mentor for each milestone.

## 🔒 Security Posture
- **SSL / TLS:** Full edge SSL termination managed automatically by Cloudflare.
- **CORS:** Strict origin validation allowing only `careersea.in`, `www.careersea.in`, and verified local development origins.
- **RLS:** Enabled on all Supabase tables to block direct unauthenticated client-side REST access; backend Worker uses secure `service_role` key.
- **Auth:** Supabase Auth. The Worker holds no signing secret and performs no password hashing — it validates the browser's access token via `supabase.auth.getUser()` on protected routes.
- **JWT Refresh:** Frontend `api.js` interceptor refreshes the Supabase session on 401 and retries the original request.
- **Edge Performance:** 0ms cold starts, global V8 isolate execution, and zero container maintenance overhead.
