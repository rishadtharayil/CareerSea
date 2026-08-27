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
- **Styling:** Tailwind CSS (Modern Utility-First)
- **Animations:** Framer Motion
- **Icons:** Lucide-React
- **Routing:** React Router 7

### Backend
- **Framework:** Django 6.0
- **API:** Django REST Framework
- **Auth:** Simple JWT
- **Database:** PostgreSQL (Production) / SQLite (Dev)
- **AI (Primary):** Google Vertex AI — Gemini 2.0 Flash via `google-cloud-aiplatform` SDK
- **AI (Fallback):** OpenRouter API — toggle with `AI_PROVIDER=openrouter` env var
- **Static Files:** WhiteNoise

### Infrastructure
- **Platform:** Google Cloud (GCP)
- **Compute:** Cloud Run (Serverless Containers)
- **Storage:** Supabase PostgreSQL & Artifact Registry
- **Security:** Secret Manager & Workload Identity Federation
- **CI/CD:** GitHub Actions

---

## 🏗️ Project Structure

```text
├── .github/workflows/  # Automated deployment pipelines
├── backend/            # Django API Service
│   ├── api/            # App logic, models, and views
│   ├── core/           # Project configuration
│   └── Dockerfile      # Production container config
├── frontend/           # React Web Application
│   ├── src/
│   │   ├── api.js      # Centralized axios client w/ JWT refresh interceptor
│   │   ├── components/ # Reusable UI components
│   │   └── pages/      # Route-level page components
│   └── Dockerfile      # Multi-stage production build
└── README.md
```

---

## 🚀 Local Development

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# .\venv\Scripts\activate  # Windows

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
*Note: Ensure you have an `.env` file with `OPENROUTER_API_KEY`.*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🚢 Deployment

This project is configured for **Zero-Touch Deployment**. 

Any push to the `main` branch triggers a GitHub Action that:
1. Authenticates with GCP via Workload Identity Federation (Keyless).
2. Builds optimized Docker containers for both services.
3. Deploys them to Cloud Run.
4. Handles database migrations and static file collection automatically.

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Created with ❤️ by Rishad Tharayil*
