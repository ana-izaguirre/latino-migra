import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "10mb" }));

// Rate limiter for general API routes to mitigate DoS & brute force
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 120, // Limit each IP to 120 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiadas solicitudes desde esta IP. Por favor, inténtalo de nuevo en unos minutos.",
  },
});

// Stricter rate limiter for AI generation endpoint
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40, // Limit each IP to 40 AI chats per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Has alcanzado el límite de consultas de IA por periodo. Por favor espera unos minutos.",
  },
});

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

app.post("/api/chat", chatLimiter, async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "El mensaje es requerido." });
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
    let contents = [];
    if (history && Array.isArray(history) && history.length > 0) {
      for (const item of history) {
        if (item.role === "user") {
          contents.push({ role: "user", parts: [{ text: item.content }] });
        } else if (item.role === "model" || item.role === "assistant") {
          contents.push({ role: "model", parts: [{ text: item.content }] });
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

    const replyText = response.text || "No se pudo generar una respuesta. Por favor intenta de nuevo.";

    res.json({ text: replyText });
  } catch (error: any) {
    console.error("Error en /api/chat:", error);
    res.status(500).json({
      error: "Error interno al procesar la consulta con LatinoMigra IA.",
      details: error.message || String(error),
    });
  }
});

// Vite Development or Production Server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[LatinoMigra] Servidor ejecutándose en http://0.0.0.0:${PORT}`);
  });
}

startServer();
