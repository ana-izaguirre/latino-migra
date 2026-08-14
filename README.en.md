# LatinoMigra 🌍🎓 (English Documentation)

[![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%26%20Auth-orange?logo=firebase)](https://firebase.google.com/)
[![Gemini API](https://img.shields.io/badge/Google%20GenAI-Gemini%20Flash-brightgreen?logo=google)](https://ai.google.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-Unit%20Tests-729B1B?logo=vitest&logoColor=white)](https://vitest.dev/)
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
7. **Alerts & Notification Center**: Custom reminders for scholarship deadlines, visa law updates, and web push notifications.

---

### Architecture

```mermaid
graph TD
    subgraph Client["Frontend Client (React 19 + Tailwind CSS)"]
        UI["User Interface & Modular Views"]
        i18n["Internationalization (ES / EN)"]
        ScrollNav["Smart Floating Nav (Top/Bottom)"]
        AuthUI["Google Sign-In (Firebase Auth)"]
    end

    subgraph Server["Backend Server (Express + Node.js)"]
        Proxy["Secure API Key Proxy (/api/chat)"]
        GeminiSDK["@google/genai SDK"]
    end

    subgraph FirebaseCloud["Cloud Firestore & Firebase Auth"]
        AuthService["Firebase Authentication"]
        PostsCol["Collection /forumPosts"]
        RepliesSub["Subcollection /replies"]
        UsersCol["Collection /users"]
        Rules["Firestore Security Rules"]
    end

    subgraph AI["Google GenAI"]
        GeminiModel["Gemini 2.5 Flash"]
    end

    UI -->|API Requests /api/chat| Proxy
    UI -->|Direct Authentication| AuthService
    UI -->|Cursor-paginated queries| PostsCol
    PostsCol --> RepliesSub
    Proxy --> GeminiSDK
    GeminiSDK --> GeminiModel
```

---

### Development & Testing

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Run TypeScript Lint check
npm run lint

# Run fast Vitest unit tests (<2 seconds)
npm run test:unit

# Run End-to-End tests (Playwright - Chromium default)
npm run test:e2e

# Build production bundle
npm run build

# Start production server
npm start
```

---

### Deployment on Vercel & Environment Variables

To protect credentials from being committed to Git, configure the following **Environment Variables** in your Vercel Dashboard (**Project Settings ➔ Environment Variables**):

| Variable | Description | Scope |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API Key | Server-side only |
| `VITE_FIREBASE_API_KEY` | Firebase API Key | Frontend (Vite) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain (`*.firebaseapp.com`) | Frontend (Vite) |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | Frontend (Vite) |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | Frontend (Vite) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | Frontend (Vite) |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID | Frontend (Vite) |
| `VITE_FIREBASE_DATABASE_ID` | Firestore Database ID (optional if default) | Frontend (Vite) |
