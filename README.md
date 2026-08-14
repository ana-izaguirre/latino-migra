# LatinoMigra 🌍🎓

[![Deploy on Cloud Run](https://img.shields.io/badge/Google%20Cloud-Cloud%20Run-blue?logo=google-cloud)](https://cloud.google.com/run)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%26%20Auth-orange?logo=firebase)](https://firebase.google.com/)
[![Gemini API](https://img.shields.io/badge/Google%20GenAI-Gemini%20Flash-brightgreen?logo=google)](https://ai.google.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E%20Testing-45ba4b?logo=playwright&logoColor=white)](https://playwright.dev/)

> **Idiomas / Languages:** **Español 🇪🇸** | [English 🇬🇧](./README.en.md)

---

## 🇪🇸 Descripción del Proyecto

**LatinoMigra** es una plataforma web integral diseñada para estudiantes y profesionales latinoamericanos que desean migrar a España, Europa o Norteamérica para cursar estudios de grado, máster, cursos de idiomas o formación técnica.

### 🚀 Módulos Principales
1. **🎓 Explorador de Becas y Ayudas**: Buscador con filtros por país de origen, destino y nivel educativo (Fundación Carolina, DAAD, Erasmus+, AUIP, Santander, etc.).
2. **🤖 Asistente de IA con Gemini**: Respuestas al instante sobre visados de estudiante, seguros médicos homologados, equivalencias y coste de vida.
3. **💬 Comunidad y Foros en la Nube**: Desarrollado con **Cloud Firestore**, con paginación optimizada por cursores, detección de dudas duplicadas y respuestas por hilo.
4. **💰 Calculadora de Presupuesto**: Estimador mensual con desglose de alojamiento, manutención, transporte y seguro según la ciudad.
5. **🗺️ Planificador y Hoja de Ruta**: Cronograma interactivo con pasos antes, durante y después del viaje.
6. **📍 Directorio de Consulados y Embajadas**: Ubicación de representaciones consulares con enlaces directos a citas oficiales.

---

## 🏗️ Arquitectura Técnica

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Frontend)                       │
│  React 19 + TypeScript + Tailwind CSS v4 + Motion           │
│  - Autenticación Google (Firebase Auth)                     │
│  - Firestore SDK (Consultas paginadas por cursores)         │
│  - Internacionalización i18n (Español / Inglés)             │
│  - Navegación Flotante Inteligente                          │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
       Llamadas a la API               Consultas Directas
        (POST /api/chat)              (Auth & Firestore Rules)
               │                               │
┌──────────────▼───────────────┐ ┌─────────────▼──────────────┐
│     SERVIDOR (Backend)       │ │     CLOUD FIRESTORE & AUTH │
│  Express.js + Node.js (TS)   │ │  - Colección /forumPosts   │
│  - Proxy seguro de API keys  │ │  - Subcolección /replies   │
│  - SDK @google/genai         │ │  - Colección /users        │
│  - Compilado a CJS (esbuild) │ │  - Colección /savedScholar │
│  - Puerto 3000 (Cloud Run)   │ │  - Reglas de Seguridad     │
└──────────────┬───────────────┘ └────────────────────────────┘
               │
┌──────────────▼───────────────┐
│     GOOGLE GENAI (Gemini)    │
│  - Modelo Gemini 2.5 Flash   │
│  - Generación de respuestas  │
└──────────────────────────────┘
```

---

## 💻 Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo (Express + Vite)
npm run dev

# 3. Validar TypeScript y estilo
npm run lint

# 4. Ejecutar pruebas End-to-End con Playwright
npm run test:e2e

# 5. Compilar para producción
npm run build

# 6. Iniciar en producción
npm start
```

---

## 🚀 Despliegue

### Despliegue en Vercel
1. Conecta tu repositorio de GitHub en [Vercel](https://vercel.com).
2. Añade las variables de entorno (`GEMINI_API_KEY`, `VITE_FIREBASE_*`).
3. Activa **Analytics** y **Speed Insights** en la pestaña correspondiente del panel de Vercel.

### Despliegue en Google Cloud Run
```bash
gcloud run deploy latino-migra \
  --source . \
  --platform managed \
  --region europe-west2 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars="GEMINI_API_KEY=TU_API_KEY,NODE_ENV=production"
```
