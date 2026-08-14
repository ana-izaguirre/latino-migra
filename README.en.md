# LatinoMigra 🌍🎓 (English Documentation)

[![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%26%20Auth-orange?logo=firebase)](https://firebase.google.com/)
[![Gemini API](https://img.shields.io/badge/Google%20GenAI-Gemini%20Flash-brightgreen?logo=google)](https://ai.google.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E%20Testing-45ba4b?logo=playwright&logoColor=white)](https://playwright.dev/)

> **Languages:** [Español (Principal) 🇪🇸](./README.md) | **English 🇬🇧**

---

### Project Overview
**LatinoMigra** is a comprehensive web platform created for Latin American students and professionals migrating to Spain, Europe, and North America for university degrees, master's programs, language courses, or vocational training.

### Key Features
1. **Scholarships & Grants Explorer**: Filter by country of origin, destination, and study level (Fundación Carolina, DAAD, Erasmus+, AUIP, Santander, etc.).
2. **Gemini AI Assistant**: Provides instant answers regarding student visas, medical insurance, academic homologation, and cost of living.
3. **Cloud-Synced Community Forum**: Powered by **Cloud Firestore** with cursor pagination, real-time duplicate question alerts, and subcollections for threaded replies.
4. **Living Cost & Budget Calculator**: Monthly breakdown of housing, food, transportation, and healthcare by city.
5. **Interactive Migration Checklist**: Step-by-step roadmap before, during, and after arriving in the destination country.
6. **Consulate Directory & Maps**: Consulate directory with official appointment booking links.

---

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Frontend)                        │
│  React 19 + TypeScript + Tailwind CSS v4 + Motion           │
│  - Google Sign-In (Firebase Auth)                           │
│  - Firestore SDK (Cursor pagination)                        │
│  - Internationalization i18n (Spanish / English)            │
│  - Smart Floating Scroll Navigation                         │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
          API Requests                    Direct SDK
        (POST /api/chat)             (Auth & Security Rules)
               │                               │
┌──────────────▼───────────────┐ ┌─────────────▼──────────────┐
│     SERVER (Backend)         │ │     CLOUD FIRESTORE & AUTH │
│  Express.js + Node.js (TS)   │ │  - Collection /forumPosts  │
│  - Secret API Key Proxy      │ │  - Subcollection /replies  │
│  - @google/genai SDK         │ │  - Collection /users       │
│  - Bundled CJS via esbuild   │ │  - Collection /savedScholar│
│  - Port 3000 (Cloud Run)     │ │  - Strict Security Rules   │
└──────────────┬───────────────┘ └────────────────────────────┘
               │
┌──────────────▼───────────────┐
│     GOOGLE GENAI (Gemini)    │
│  - Gemini 2.5 Flash Model    │
│  - AI Streaming / Responses  │
└──────────────────────────────┘
```

---

### Quick Start & Development

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Run TypeScript Lint check
npm run lint

# Run End-to-End tests (Playwright)
npm run test:e2e

# Build production bundle
npm run build

# Start production server
npm start
```

---

### Deployment

#### 1. Vercel
1. Import repository on [Vercel](https://vercel.com).
2. Add Environment Variables (`GEMINI_API_KEY`, `VITE_FIREBASE_*`).
3. Enable **Web Analytics** & **Speed Insights** in the Vercel dashboard.

#### 2. Google Cloud Run
```bash
gcloud run deploy latino-migra \
  --source . \
  --platform managed \
  --region europe-west2 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars="GEMINI_API_KEY=YOUR_API_KEY,NODE_ENV=production"
```
