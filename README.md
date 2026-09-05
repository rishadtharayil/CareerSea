This project is not live anymore. GCP trial is over 🫠

# CareerSea | AI Career Navigator

**Stop guessing, start sailing.** CareerSea is a professional-grade, AI-powered career guidance platform that generates hyper-personalized roadmaps based on your unique interests, values, and problem-solving style.

~~🔗 **Live Demo:** [https://careersea.in](https://careersea.in)~~

---

## ✨ Features

- **🧠 AI-Powered Analysis:** Uses Gemini models via OpenRouter to generate deep-dive career suggestions and actionable roadmaps.
- **🔐 Secure Authentication:** Full User System with JWT-based login and registration.
- **🚀 Cloud-Native Architecture:** Fully containerized and deployed on Google Cloud Platform using Serverless technology.
- **📱 Responsive Design:** Modern "Neubrutalist" aesthetic, meticulously polished for Mobile, Tablet, and Desktop users.
- **🛡️ Production Hardened:** 
  - Automated CI/CD pipeline via GitHub Actions.
  - Secrets encrypted in Google Cloud Secret Manager.
  - Persistent managed PostgreSQL database (Supabase).
  - Rate limiting to protect AI budget (2/min burst, 10/day per user).
  - Forced HTTPS and HSTS security headers.
  - Explicit per-view permission classes on all API endpoints.
  - Automatic JWT access-token refresh with queued retry on expiry.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS (Neubrutalism design)
- **Animations:** Framer Motion
- **Icons:** Lucide-React
- **Routing:** React Router 7
- **Hosting:** Cloudflare Pages (Global Edge CDN)

### Backend (Edge Worker)
- **Runtime:** Cloudflare Workers (V8 Isolate)
- **Framework:** Hono (TypeScript)
- **Auth:** PBKDF2-SHA256 (Django compatible) + HS256 JWT
- **Database:** PostgreSQL (Managed by Supabase via PostgREST HTTPS Client)
- **AI (Primary):** Google AI Studio — Gemini 3.1 Flash Lite
- **AI (Fallback):** OpenRouter API (`google/gemini-2.0-flash-001`)

### Infrastructure & CI/CD
- **Edge Compute:** Cloudflare Workers (`careersea-api`)
- **Frontend Hosting:** Cloudflare Pages (`careersea-frontend`)
- **DNS & SSL:** Cloudflare Edge DNS (`careersea.in` & `api.careersea.in`)
- **Database:** Supabase PostgreSQL
- **CI/CD:** GitHub Actions via Cloudflare Wrangler Action

---

## 🏗️ Project Structure

```text
├── .github/workflows/
│   ├── deploy-cloudflare.yml # Automated deployment to Cloudflare
│   └── deploy.yml            # Legacy Cloud Run deployment
├── frontend/                 # React 19 + Vite SPA (Cloudflare Pages)
│   ├── public/_redirects     # SPA routing configuration
│   └── src/                  # React UI components and pages
├── worker/                   # TypeScript + Hono API (Cloudflare Worker)
│   ├── src/
│   │   ├── routes/           # Auth, Questions, Assessment, Steps, History
│   │   ├── services/         # Supabase client, PBKDF2 auth, Gemini AI
│   │   ├── types.ts          # Type definitions
│   │   └── index.ts          # Central Hono application
│   └── wrangler.jsonc        # Cloudflare Worker configuration
├── backend/                  # Legacy Django application
├── CLOUDFLARE_SETUP_GUIDE.md # Complete step-by-step setup guide
├── ARCHITECTURE.md           # System architecture overview
└── README.md
```

---

## 🚀 Local Development

### 1. Backend Worker Setup
```bash
cd worker
npm install
# Create worker/.dev.vars with your API keys (see CLOUDFLARE_SETUP_GUIDE.md)
npm run dev
```
The Worker runs locally at `http://localhost:8787`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The Frontend runs locally at `http://localhost:5173`.

---

## 🚢 Deployment

Deployment is fully automated with **GitHub Actions**:

Any push to the `main` branch triggers `.github/workflows/deploy-cloudflare.yml` which:
1. Builds and publishes the Backend Worker to Cloudflare's global edge network via Wrangler.
2. Builds the React SPA (`npm run build`) and deploys the static bundle to Cloudflare Pages.

For manual deployment or initial configuration, follow the [Cloudflare Setup Guide](CLOUDFLARE_SETUP_GUIDE.md).

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Created with ❤️ by Rishad Tharayil*
