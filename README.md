# LatinoMigra 🌍🎓

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%26%20Auth-orange?logo=firebase)](https://firebase.google.com/)
[![Gemini API](https://img.shields.io/badge/Google%20GenAI-Gemini%20Flash-brightgreen?logo=google)](https://ai.google.dev/)

> **Idiomas / Languages:** [Español 🇪🇸](#español) | [English 🇬🇧](#english)

---

<a name="español"></a>
## 🇪🇸 Español

### Descripción del Proyecto
**LatinoMigra** es una plataforma integral diseñada para estudiantes y profesionales latinoamericanos que desean migrar a España y otros destinos de Europa y Norteamérica para realizar estudios de grado, máster, cursos de idiomas o formación técnica.

La aplicación centraliza:
1. **Explorador de Becas y Ayudas**: Directorio filtrable por país de origen, destino y nivel educativo (Fundación Carolina, DAAD, Erasmus+, AUIP, Santander, etc.).
2. **Asistente de IA con Gemini**: Respuestas contextualizadas sobre trámites de visado, seguro médico, requisitos de homologación de títulos y costo de vida.
3. **Comunidad y Foros en la Nube**: Espacio colaborativo conectado a **Cloud Firestore** con paginación optimizada, prevención de preguntas duplicadas en tiempo real y subcolecciones de respuestas por hilo.
4. **Calculadora de Presupuesto y Coste de Vida**: Estimador mensual con desglose de alojamiento, alimentación, transporte y seguro en diferentes ciudades de destino.
5. **Planificador de Ruta Migratoria**: Checklist paso a paso con cronograma interactivo de hitos antes, durante y después del viaje.
6. **Mapa Interactivo de Consulados y Embajadas**: Ubicación de representaciones consulares con enlaces oficiales a citas previas.

---

### Arquitectura Técnica

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

#### Puntos Clave de Seguridad y Optimización:
- **Seguridad de Claves API**: La clave `GEMINI_API_KEY` permanece 100% en el servidor (`server.ts`) y nunca se expone al navegador.
- **Consultas Eficientes en Firestore**: Paginación con cursor (`startAfter`) que carga lotes de 6 posts para minimizar costos y lecturas.
- **Reglas de Seguridad**: `firestore.rules` valida tipos de datos, límites de caracteres (≤ 300 en títulos, ≤ 5000 en contenido) e impide escrituras directas sobre usuarios ajenos.

---

### Despliegue Paso a Paso en Google Cloud Run

#### Requisitos Previos:
1. Tener una cuenta en [Google Cloud Console](https://console.cloud.google.com/).
2. Tener instalado el [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install) en tu máquina local.
3. Tener Docker instalado (o usar Cloud Build de GCP).

---

#### Método 1: Despliegue Directo desde Código Fuente con `gcloud` (Recomendado)

1. **Iniciar sesión en Google Cloud y seleccionar el proyecto:**
   ```bash
   gcloud auth login
   gcloud config set project TU_PROJECT_ID
   ```

2. **Habilitar las APIs necesarias:**
   ```bash
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com
   ```

3. **Construir y Desplegar en Cloud Run:**
   Ejecuta el siguiente comando en la raíz del proyecto (reemplazando `TU_GEMINI_API_KEY` por tu clave de API de Google AI Studio):
   ```bash
   gcloud run deploy latino-migra \
     --source . \
     --platform managed \
     --region europe-west2 \
     --allow-unauthenticated \
     --port 3000 \
     --set-env-vars="GEMINI_API_KEY=TU_GEMINI_API_KEY,NODE_ENV=production"
   ```

4. ¡Listo! Cloud Run compilará la aplicación con Vite y esbuild y te entregará una URL HTTPS pública (ej. `https://latino-migra-xxxx.run.app`).

---

#### Método 2: Despliegue con Dockerfile

Si prefieres construir tu propia imagen de contenedor:

1. **Crear el contenedor con Docker:**
   ```bash
   docker build -t gcr.io/TU_PROJECT_ID/latino-migra:latest .
   ```

2. **Subir la imagen al registro de contenedores:**
   ```bash
   docker push gcr.io/TU_PROJECT_ID/latino-migra:latest
   ```

3. **Desplegar la imagen en Cloud Run:**
   ```bash
   gcloud run deploy latino-migra \
     --image gcr.io/TU_PROJECT_ID/latino-migra:latest \
     --platform managed \
     --region europe-west2 \
     --allow-unauthenticated \
     --port 3000 \
     --set-env-vars="GEMINI_API_KEY=TU_GEMINI_API_KEY,NODE_ENV=production"
   ```

---

#### Variables de Entorno Requeridas

| Variable | Descripción | Dónde se define |
|---|---|---|
| `GEMINI_API_KEY` | Clave de Google AI Studio para el asistente | Variables de entorno de Cloud Run |
| `NODE_ENV` | Modo de ejecución (`production`) | Variables de entorno de Cloud Run |
| `PORT` | Puerto donde escucha Express (`3000`) | Configurado en Cloud Run (`--port 3000`) |

---

<br/>

---

<a name="english"></a>
## 🇬🇧 English

### Project Overview
**LatinoMigra** is a comprehensive web platform created for Latin American students and professionals migrating to Spain, Europe, and North America for university degrees, master's programs, language courses, or professional training.

Key features:
1. **Scholarships & Grants Explorer**: Search and filter by country of origin, destination, and study level (Fundación Carolina, DAAD, Erasmus+, AUIP, Santander, etc.).
2. **Gemini AI Assistant**: Provides instant answers regarding student visas, medical insurance, academic homologation, and cost of living.
3. **Cloud-Synced Community Forum**: Powered by **Cloud Firestore** featuring cursor-based pagination, real-time duplicate question detection, and threaded replies.
4. **Living Cost & Budget Calculator**: Monthly estimate breakdown for housing, food, transportation, and healthcare per city.
5. **Interactive Migration Checklist**: Step-by-step roadmap before, during, and after arriving in the destination country.
6. **Consulate Locator Map**: Interactive directory of consulates with official appointment booking links.

---

### Technical Architecture

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

### Step-by-Step Deployment to Google Cloud Run

#### Prerequisites:
1. A [Google Cloud Console](https://console.cloud.google.com/) account.
2. [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install) installed locally.
3. Docker installed (optional, Cloud Build can build directly from source).

---

#### Method 1: Deploy Directly from Source (Recommended)

1. **Login to Google Cloud and select your Project:**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Enable Cloud Run and Cloud Build APIs:**
   ```bash
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com
   ```

3. **Build and Deploy to Cloud Run:**
   Run this command in the project root directory (replace `YOUR_GEMINI_API_KEY` with your actual API key):
   ```bash
   gcloud run deploy latino-migra \
     --source . \
     --platform managed \
     --region europe-west2 \
     --allow-unauthenticated \
     --port 3000 \
     --set-env-vars="GEMINI_API_KEY=YOUR_GEMINI_API_KEY,NODE_ENV=production"
   ```

4. Cloud Run will build the production assets and output a live HTTPS URL.

---

### Scripts & Development

```bash
# Start local development server (Express + Vite)
npm run dev

# Run TypeScript Lint check
npm run lint

# Run Unit tests
npm run test

# Run End-to-End tests (Playwright)
npm run test:e2e

# Build production bundle
npm run build

# Start production server
npm start
```
