import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "10mb" }));

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

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "El mensaje es requerido." });
    }

    const systemInstruction = `
Eres LatinoMigra IA, el asistente experto en inmigración, trámites consulares, visas, costo de vida y becas internacionales para estudiantes y profesionales latinoamericanos.

Principios de respuesta:
1. Sé cálido, empático, claro y muy estructurado. Usa viñetas, negritas e iconos si ayuda a la legibilidad.
2. Enfócate especialmente en los trámites para latinoamericanos (ej. Apostilla de la Haya en país de origen, carta de aceptación, fondos económicos IPREM/moneda local, homologación de títulos, TIE/NIE en España, visas en Alemania, EE.UU., Canadá).
3. Responde en español con un tono profesional pero esperanzador y cercano ("Confianza, Claridad y Esperanza").
4. Si la consulta se refiere a España u otros países, da pasos concretos, requisitos claros y estimaciones realistas.
5. Incluye siempre una sección final llamada "Fuentes oficiales recomendadas" citando consulados, Ministerios de Asuntos Exteriores o portales oficiales de inmigración.
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
