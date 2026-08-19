import express from "express";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Cloud Run terminates TLS one hop in front of us, so the client address comes
// from X-Forwarded-For. Trusting exactly one hop lets the rate limiter key on
// the real client instead of the proxy, without letting callers spoof the
// header by appending their own entries.
app.set("trust proxy", 1);

const isDevelopment = process.env.NODE_ENV !== "production";

/**
 * Security headers, including an enforced Content-Security-Policy.
 *
 * Disabling the CSP outright is not an option — it is the header that limits
 * what a successful injection can do. The only reason it was hard to enable is
 * that the Vite dev server injects an inline preamble script and opens an HMR
 * websocket, both of which a strict policy blocks (React then never mounts).
 * So the policy is enforced everywhere and only *relaxed* in development.
 *
 * The GA4 configuration was moved out of index.html into /analytics.js so
 * production needs no 'unsafe-inline' for scripts.
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://www.googletagmanager.com",
          "https://maps.googleapis.com",
          // Vite's dev preamble is inline and has no stable hash.
          ...(isDevelopment ? ["'unsafe-inline'"] : []),
        ],
        // Tailwind injects styles at runtime.
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          "https://*.googleapis.com",
          "https://*.firebaseio.com",
          "https://www.google-analytics.com",
          // HMR websocket.
          ...(isDevelopment ? ["ws:", "wss:"] : []),
        ],
        frameSrc: ["'self'", "https://*.firebaseapp.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: isDevelopment ? null : [],
      },
    },
    // Cross-origin isolation would block the third-party maps and images.
    crossOriginEmbedderPolicy: false,
  })
);

// The API only ever returns JSON, so it can take the strictest possible policy:
// nothing is allowed to load or execute from an API response.
app.use(
  "/api",
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
    },
  })
);

// 10mb was sized for file uploads the API does not accept. The chat endpoint
// only takes a message and a short history, both length-capped below.
app.use(express.json({ limit: "128kb" }));

/**
 * Rate limiting.
 *
 * This used to be a hand-rolled in-memory limiter. It worked, but it was also
 * an unbounded Map (every distinct IP leaked an entry forever) and static
 * analysis could not recognise it as a rate limiter, which is what raised the
 * "Missing rate limiting" code scanning alert. `express-rate-limit` is the
 * standard implementation and expires its own buckets.
 */
const buildLimiter = (windowMs: number, limit: number, message: string) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: message },
  });

// General API traffic: mitigates brute force and casual scraping.
const apiLimiter = buildLimiter(
  15 * 60 * 1000,
  120,
  "Demasiadas solicitudes desde esta IP. Por favor, inténtalo de nuevo en unos minutos."
);

// Stricter budget for the AI generation endpoint, which is the expensive one.
const chatLimiter = buildLimiter(
  15 * 60 * 1000,
  40,
  "Has alcanzado el límite de consultas de IA por periodo. Por favor espera unos minutos."
);

// The cron endpoint performs an authorization check, so it needs its own tight
// budget to keep CRON_SECRET from being brute forced.
const cronLimiter = buildLimiter(
  15 * 60 * 1000,
  10,
  "Demasiados intentos de sincronización. Inténtalo de nuevo más tarde."
);

// Static asset and SPA fallback traffic hits the file system on every request.
const staticLimiter = buildLimiter(
  15 * 60 * 1000,
  600,
  "Demasiadas solicitudes desde esta IP. Por favor, inténtalo de nuevo en unos minutos."
);

app.use("/api/", apiLimiter);

// Lazy Google GenAI Client Initialization
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "dummy-key-for-boot",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "LatinoMigra" });
});

/** Caps on untrusted input forwarded to the model, to bound cost and abuse. */
const MAX_MESSAGE_LENGTH = 4000;
const MAX_HISTORY_TURNS = 20;

app.post("/api/chat", chatLimiter, async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "El mensaje es requerido." });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(413).json({
        error: `El mensaje supera el límite de ${MAX_MESSAGE_LENGTH} caracteres.`,
      });
    }

    const systemInstruction = `
Eres LatinoMigra IA, el asesor experto en inmigración, trámites consulares, visas, costo de vida y becas internacionales para estudiantes y profesionales latinoamericanos.

Capacidades y Principios de Respuesta:
1. IDIOMA: Responde en el idioma del usuario (Español o Inglés). Si el usuario escribe en inglés o solicita respuesta en inglés, responde fluidamente en inglés manteniendo la misma estructura y calidez.
2. EVALUACIÓN Y DIAGNÓSTICO DE PERFIL MIGRATORIO:
   Si el usuario comparte su carrera/profesión, edad, situación familiar (solo, pareja, hijos), presupuesto o nivel de idiomas, genera un DIAGNÓSTICO ESTRUCTURADO Y ACCIONABLE con:
   - 🥇 PAÍS RECOMENDADO #1 Y JUSTIFICACIÓN: Por qué encaja con su edad (puntos de edad en Express Entry o Chancenkarte, o facilidad de idioma y 2 años para nacionalidad en España para iberoamericanos).
   - 🥈 PAÍS ALTERNATIVO: Una segunda opción viable (ej. Irlanda para cursos de inglés con trabajo Stamp 2, o Alemania para universidades públicas sin costo).
   - 🎓 VÍA MIGRATORIA RECOMENDADA: Beca específica (DAAD, Fundación Carolina, Eiffel, Erasmus Mundus, Fulbright), visa de estudio con trabajo, visa de profesional cualificado o nómada digital.
   - 👨‍👩‍👧 IMPACTO FAMILIAR: ¿La pareja puede trabajar legalmente con permiso abierto? ¿Los hijos tienen acceso a colegios públicos gratuitos?
   - 💰 PRESUPUESTO & FONDOS MÍNIMOS: Exigencia real demostrable (IPREM en España, Sperrkonto en Alemania, IRCC en Canadá, IRP en Irlanda).
   - 🚀 PRIMEROS 3 PASOS INMEDIATOS: Acciones concretas a realizar hoy.
3. CONFIANZA Y VERIFICABILIDAD: Cita siempre al final portales oficiales verificados (Consulados, Ministerios, IRCC, DAAD, SEPIE, etc.).
4. TONO: Cercano, riguroso, sin falsas promesas, con esperanza y total claridad técnica.
`;

    // Construct conversation context if provided
    const contents = [];
    if (history && Array.isArray(history) && history.length > 0) {
      // Only the most recent turns are forwarded, and each is length-capped,
      // so a caller cannot inflate a request with unbounded history.
      for (const item of history.slice(-MAX_HISTORY_TURNS)) {
        if (typeof item?.content !== "string") continue;
        const text = item.content.slice(0, MAX_MESSAGE_LENGTH);
        if (item.role === "user") {
          contents.push({ role: "user", parts: [{ text }] });
        } else if (item.role === "model" || item.role === "assistant") {
          contents.push({ role: "model", parts: [{ text }] });
        }
      }
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await getGenAI().models.generateContent({
      model: "gemini-3.6-flash",
      contents: contents.length === 1 ? message : contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText =
      response.text || "No se pudo generar una respuesta. Por favor intenta de nuevo.";

    res.json({ text: replyText });
  } catch (error) {
    console.error("Error en /api/chat:", error);
    res.status(500).json({
      error: "Error interno al procesar la consulta con LatinoMigra IA.",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// CRON JOB AUTOMATION ENDPOINT: Annual / Periodic Scholarship Synchronizer using Gemini IA
app.post("/api/cron/sync-scholarships", cronLimiter, async (req, res) => {
  try {
    const { academicYear = "2026-2027", secretKey } = req.body;

    // Fails closed. This used to be `if (process.env.CRON_SECRET && ...)`,
    // which meant that with the variable unset the endpoint was wide open and
    // any caller could burn the project's Gemini quota.
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error("CRON_SECRET is not configured; refusing to run the sync job.");
      return res.status(503).json({
        error: "El sincronizador no está configurado en este entorno.",
      });
    }
    if (secretKey !== cronSecret) {
      return res.status(401).json({ error: "Unauthorized: Invalid CRON_SECRET key." });
    }

    const ai = getGenAI();

    const prompt = `Actúa como un analista oficial de becas internacionales universitarias para estudiantes latinoamericanos.
Genera o actualiza la lista de convocatorias de becas para el ciclo académico ${academicYear} (Fundación Carolina, DAAD, Erasmus Mundus, Eiffel, Fulbright, Chevening, Gates Cambridge, OEA, AUIP, USAL, Santander, Vanier Canadá, etc.).

Devuelve un arreglo JSON válido con las becas actualizadas. Cada objeto debe tener la siguiente estructura exacta:
[
  {
    "id": "beca-carolina-${academicYear.split("-")[0]}",
    "title": "Beca Excelencia Fundación Carolina",
    "institution": "Universidad Complutense de Madrid / Universidades Españolas",
    "institutionType": "Fundación",
    "officialPortalName": "Fundación Carolina (Oficial)",
    "country": "España",
    "countryCode": "ES",
    "area": "STEM",
    "supportType": "Beca Completa",
    "deadline": "Cierra en Octubre",
    "deadlineDate": "2026-10-15",
    "academicYear": "${academicYear}",
    "description": "Financia estudios de máster y posgrados en universidades públicas y privadas de España para graduados de Iberoamérica.",
    "requirements": [
      "Ser nacional de un país de la Comunidad Iberoamericana de Naciones.",
      "Poseer título universitario oficial de grado o licenciatura.",
      "Acreditar expediente académico destacado."
    ],
    "benefits": [
      "Matrícula 100% cubierta.",
      "Boleto de avión ida y vuelta.",
      "Asignación mensual de manutención (~750€ - 1,000€).",
      "Seguro médico integral."
    ],
    "link": "https://www.fundacioncarolina.es",
    "imageUrl": "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80",
    "lastVerifiedAt": "${new Date().toISOString()}"
  }
]
Genera al menos 15 convocatorias oficiales líderes. Asegúrate de que el formato sea estrictamente un JSON válido (sin markdown adicional si es posible).`;

    const result = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    let rawText = result.text?.trim() || "[]";
    if (rawText.startsWith("```json")) {
      rawText = rawText.replace(/```json\n?/, "").replace(/\n?```$/, "");
    } else if (rawText.startsWith("```")) {
      rawText = rawText.replace(/```\n?/, "").replace(/\n?```$/, "");
    }

    // The model returns free-form JSON, so nothing about the shape is
    // guaranteed until it is validated. `unknown[]` keeps that honest --
    // `any[]` would silently allow any property access downstream.
    let parsedScholarships: unknown[] = [];
    try {
      const parsed: unknown = JSON.parse(rawText);
      if (Array.isArray(parsed)) {
        parsedScholarships = parsed;
      } else if (parsed && typeof parsed === "object") {
        const wrapper = parsed as { scholarships?: unknown; items?: unknown };
        const inner = wrapper.scholarships ?? wrapper.items;
        parsedScholarships = Array.isArray(inner) ? inner : [];
      }
    } catch (parseErr) {
      console.error("JSON parse error from Gemini:", parseErr);
      return res
        .status(500)
        .json({ error: "No se pudo interpretar el formato generado por la IA." });
    }

    // Return the generated & verified dataset ready to be stored in Firestore or frontend
    res.json({
      success: true,
      academicYear,
      updatedCount: parsedScholarships.length,
      syncedAt: new Date().toISOString(),
      data: parsedScholarships,
      message: `¡Sincronización exitosa! Se han verificado y actualizado ${parsedScholarships.length} convocatorias para el ciclo ${academicYear}.`,
    });
  } catch (error) {
    console.error("Error en /api/cron/sync-scholarships:", error);
    res.status(500).json({
      error: "Error interno al ejecutar el cron job de sincronización de becas.",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Vite Development or Production Server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Imported lazily so Vite is never pulled into the production bundle or
    // the Vercel serverless function, which only ever serve the API routes.
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(staticLimiter, express.static(distPath));
    app.get("*", staticLimiter, (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.info(`[LatinoMigra] Servidor ejecutándose en http://0.0.0.0:${PORT}`);
  });
}

// Exported so tests can exercise the routes without booting Vite or binding a
// port, and so the Vercel serverless entry point in api/index.ts can mount the
// same app rather than duplicating it.
export { app, apiLimiter, chatLimiter, cronLimiter, staticLimiter, buildLimiter };
export default app;

// On Vercel each request is handled by the exported app, so there is no server
// to start and no port to bind.
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  startServer();
}
