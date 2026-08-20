import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Sparkles,
  Plus,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  User,
  Compass,
  Briefcase,
  GraduationCap,
  Users,
  DollarSign,
  Languages,
  Globe,
} from "lucide-react";
import { ChatMessage, ChatConversation, Scholarship } from "../types";
import { useLanguage } from "../lib/i18n";
import { useCurrency } from "../lib/CurrencyContext";
import { formatCurrency } from "../lib/currency";
import { Modal } from "./ui/Modal";

interface ChatIAProps {
  initialPrompt?: string;
  scholarshipContext?: Scholarship | null;
}

export const ChatIA: React.FC<ChatIAProps> = ({ initialPrompt }) => {
  const { language, t } = useLanguage();
  const { currency } = useCurrency();
  const [conversations, setConversations] = useState<ChatConversation[]>([
    {
      id: "conv-1",
      title: "Requisitos visa estudiante España",
      updatedAt: "Hoy, 10:15 AM",
      messages: [
        {
          id: "m-1",
          role: "user",
          content:
            "¿Cuáles son los requisitos clave para la visa de estudiante de España desde Colombia?",
          timestamp: "10:15 AM",
        },
        {
          id: "m-2",
          role: "assistant",
          content: `¡Hola, Ana! Para solicitar el **Visado de Estudiante para España** (estancias superiores a 90 días) desde Colombia o cualquier país latinoamericano, los requisitos consulares principales son:

### 1. Documentación Personal y Académica
* **Pasaporte Vigente**: Mínimo 1 año de validez restante.
* **Carta de Aceptación Oficial**: Emitida por una universidad o centro registrado en España (RUCT).
* **Certificado de Antecedentes Penales**: Apostillado por el Ministerio de Relaciones Exteriores en tu país de origen (emitido dentro de los últimos 3 meses).

### 2. Acreditación Económica y Sanitaria
* **Medios Económicos Demostrables**: Debes acreditar al menos el 100% del IPREM mensual (aprox. **600 €/mes** de estancia). Puedes certificarlo con extractos bancarios propios, carta de patrocinio familiar o concesión de Beca.
* **Seguro Médico Privado**: Debe ser de una compañía autorizada en España (Adeslas, Sanitas, DKV), **sin copagos** y con cobertura completa de repatriación.

### 3. Siguientes Pasos al Llegar a España
1. **Empadronamiento**: En el Ayuntamiento de tu ciudad.
2. **Solicitud de la TIE (Tarjeta de Identidad de Extranjero)**: Solicitar cita previa de extranjería dentro de los primeros 30 días.`,
          timestamp: "10:16 AM",
          sources: [
            { title: "Consulado General de España", url: "https://www.exteriores.gob.es" },
            {
              title: "Ministerio de Inclusión, Seguridad Social y Migraciones",
              url: "https://www.inclusion.gob.es",
            },
          ],
        },
      ],
    },
    {
      id: "conv-2",
      title: "Becas CONACYT para maestría",
      updatedAt: "Ayer",
      messages: [],
    },
    {
      id: "conv-3",
      title: "Costo de vida en Buenos Aires vs Madrid",
      updatedAt: "Hace 3 días",
      messages: [],
    },
  ]);

  const [activeConvId, setActiveConvId] = useState<string>("conv-1");
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [showProfileDiagnosisModal, setShowProfileDiagnosisModal] = useState<boolean>(false);

  // Profile Diagnosis Form state
  const [diagCareer, setDiagCareer] = useState<string>("Ingeniería de Software / IT");
  const [diagAge, setDiagAge] = useState<number>(28);
  const [diagFamily, setDiagFamily] = useState<string>("Soltero/a sin hijos");
  // Multilingual state
  const [userLanguages, setUserLanguages] = useState<
    Array<{ name: string; level: string; enabled: boolean }>
  >([
    { name: "Español", level: "Nativo / C2", enabled: true },
    { name: "Inglés", level: "Intermedio (B2)", enabled: true },
    { name: "Alemán", level: "Básico (A2)", enabled: false },
    { name: "Francés", level: "Básico (A1/A2)", enabled: false },
    { name: "Italiano", level: "Intermedio (B1)", enabled: false },
    { name: "Portugués", level: "Intermedio (B1/B2)", enabled: false },
  ]);
  const [diagBudgetTier, setDiagBudgetTier] = useState<"low" | "medium" | "high" | "premium">(
    "medium"
  );
  const [diagGoal, setDiagGoal] = useState<string>("Beca de Maestría o Posgrado 100% financiada");
  const [diagOrigin, setDiagOrigin] = useState<string>("Colombia");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages, isLoading]);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = textToSend || inputText;
    if (!prompt.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Append user message locally
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === activeConvId) {
          return {
            ...conv,
            messages: [...conv.messages, userMessage],
            title: conv.messages.length === 0 ? prompt.slice(0, 30) + "..." : conv.title,
          };
        }
        return conv;
      })
    );

    setInputText("");
    setIsLoading(true);

    try {
      // Call server API route /api/chat
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          language: language,
          history: activeConv.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: "assistant",
        content: data.reply || data.text || "No se pudo obtener la respuesta.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: data.sources || [
          { title: "Ministerio de Asuntos Exteriores", url: "https://www.exteriores.gob.es" },
          { title: "Portal de Inmigración Oficial", url: "https://extranjeros.inclusion.gob.es" },
        ],
      };

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === activeConvId) {
            return {
              ...conv,
              messages: [...conv.messages, assistantMessage],
            };
          }
          return conv;
        })
      );
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
      const errorMessage: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: "assistant",
        content:
          "Ocurrió un error al conectar con LatinoMigra IA. Por favor, verifica tu conexión o intenta nuevamente.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === activeConvId) {
            return {
              ...conv,
              messages: [...conv.messages, errorMessage],
            };
          }
          return conv;
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunProfileDiagnosis = () => {
    const activeLanguagesStr =
      userLanguages
        .filter((l) => l.enabled)
        .map((l) => `${l.name} (${l.level})`)
        .join(", ") || "Solo Español Nativo";

    const budgetLabels = {
      low: `Menos de ${formatCurrency(2000, currency)} (Prioridad Becas 100% financiada)`,
      medium: `${formatCurrency(3000, currency)} - ${formatCurrency(8000, currency)}`,
      high: `${formatCurrency(8000, currency)} - ${formatCurrency(15000, currency)} (Sperrkonto / Cursos)`,
      premium: `Más de ${formatCurrency(15000, currency)} (Estudios o mudanza familiar)`,
    };

    const budgetSelectedStr = budgetLabels[diagBudgetTier];

    const generatedPrompt = `[DIAGNÓSTICO DE PERFIL MIGRATORIO MULTILINGÜE Y PERSONALIZADO]
Por favor analiza mi perfil completo y dime exactamente cuáles son mis mejores opciones de migración (¿Beca completa, Empleo calificado, Curso de idiomas con permiso laboral o Residencia?):
- País de Origen: ${diagOrigin}
- Carrera / Profesión: ${diagCareer}
- Edad: ${diagAge} años
- Situación Familiar: ${diagFamily}
- Dominio de Idiomas (Multilingüe): ${activeLanguagesStr}
- Presupuesto Disponible: ${budgetSelectedStr} (${currency})
- Meta Principal: ${diagGoal}

Estructura tu diagnóstico con:
1. 🏆 Top 2 Países recomendados acordes a mi carrera, idiomas conocidos y edad.
2. 🛣️ Vía óptima (Beca vs Trabajo vs Estudio) con programas oficiales reales (ej. DAAD, Chancenkarte, Stamp 2 Irlanda, Express Entry Canadá, Beca Carolina).
3. 👨‍👩‍👧 Requisitos para mi familia (si aplica: permiso de trabajo para pareja, colegio público para hijos).
4. 💰 Presupuesto estimado en ${currency} y fondos de manutención exigidos por consulados.
5. 📋 3 Pasos concretos para empezar este mes considerando mi nivel de idiomas.`;

    setShowProfileDiagnosisModal(false);
    handleSendMessage(generatedPrompt);
  };

  const handleNewConversation = () => {
    const newConv: ChatConversation = {
      id: `conv-${Date.now()}`,
      title: language === "en" ? "New Consultation" : "Nueva Consulta",
      updatedAt: language === "en" ? "Just now" : "Ahora",
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const promptSuggestions = [
    {
      title: "🎯 Diagnóstico según Carrera, Edad y Familia",
      subtitle:
        "Evaluación completa de mejores países, becas o visas de empleo acordes a tu situación",
      action: () => setShowProfileDiagnosisModal(true),
    },
    {
      title: "🇪🇸 Nacionalidad Española en 2 años",
      subtitle: "Beneficio para ciudadanos latinoamericanos por 2 años de residencia legal",
      action: () =>
        handleSendMessage(
          "¿Cómo funciona el beneficio de nacionalidad española en 2 años para ciudadanos de países latinoamericanos?"
        ),
    },
    {
      title: "🇩🇪 Chancenkarte Alemania (Visa de Oportunidad)",
      subtitle: "Sistema de puntos por título profesional, idiomas y edad para buscar trabajo",
      action: () =>
        handleSendMessage(
          "Explícame la Chancenkarte de Alemania: sistema de puntos, homologación de título y cuenta bloqueada (Sperrkonto)."
        ),
    },
    {
      title: "🇮🇪 Irlanda Stamp 2: Estudiar y Trabajar 20h",
      subtitle: "Cursos de inglés con permiso legal de trabajo, IRP y trámites",
      action: () =>
        handleSendMessage(
          "¿Cuáles son los requisitos actuales para la visa Stamp 2 en Irlanda para cursos de idiomas y trabajo de 20h/semana?"
        ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 h-[calc(100vh-5rem)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-300">
      {/* Left Chat Sidebar */}
      <aside className="w-full md:w-80 bg-surface-container-lowest dark:bg-slate-800 rounded-3xl border border-outline-variant/40 dark:border-slate-700 p-4 flex flex-col justify-between shrink-0 shadow-xs">
        <div className="space-y-4">
          <div className="space-y-2">
            <button
              onClick={() => setShowProfileDiagnosisModal(true)}
              id="open-profile-diag-sidebar-btn"
              className="w-full bg-linear-to-r from-secondary to-teal-600 dark:from-teal-600 dark:to-teal-500 text-white py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition-all cursor-pointer hover:scale-101 active:scale-98"
            >
              <Compass className="w-4 h-4" />
              <span>{t("chat.evalProfile", "🎯 Diagnosticar Mi Perfil")}</span>
            </button>

            <button
              onClick={handleNewConversation}
              id="new-chat-btn"
              className="w-full bg-primary dark:bg-sky-600 hover:bg-primary-container text-white py-2.5 px-4 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === "en" ? "New Consultation" : "Nueva Consulta"}</span>
            </button>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider px-2 block">
              {language === "en" ? "Consultation History" : "Historial de Consultas"}
            </span>
            <div className="space-y-1 max-h-[45vh] md:max-h-[50vh] overflow-y-auto pr-1">
              {conversations.map((conv) => {
                const isActive = conv.id === activeConvId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`w-full text-left p-3 rounded-xl text-xs transition-colors flex items-center justify-between group cursor-pointer ${
                      isActive
                        ? "bg-primary/10 dark:bg-sky-900/40 text-primary dark:text-sky-300 font-bold"
                        : "text-on-surface-variant dark:text-slate-300 hover:bg-surface dark:hover:bg-slate-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <MessageSquare className="w-4 h-4 shrink-0 text-secondary dark:text-teal-400" />
                      <span className="truncate">{conv.title}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI Model Badge */}
        <div className="pt-4 border-t border-outline-variant/30 dark:border-slate-700 flex items-center gap-3 text-xs text-on-surface-variant dark:text-slate-400">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-300 flex items-center justify-center font-bold">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold block text-primary dark:text-sky-300">LatinoMigra IA</span>
            <span className="text-[11px] text-slate-500">Gemini 2.5 Flash • Perfil & Visas</span>
          </div>
        </div>
      </aside>

      {/* Main Chat Conversation Container */}
      <main className="flex-1 bg-surface-container-lowest dark:bg-slate-800 rounded-3xl border border-outline-variant/40 dark:border-slate-700 flex flex-col justify-between overflow-hidden relative shadow-xs">
        {/* Chat Thread Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {activeConv.messages.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-6 py-10">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-sky-900/50 text-primary dark:text-sky-300 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-secondary dark:text-teal-300" />
              </div>

              <div className="space-y-2">
                <h2 className="font-headline-md text-2xl font-extrabold text-primary dark:text-sky-300">
                  {t("chat.welcomeTitle", "¡Hola! ¿Cómo puedo ayudarte hoy?")}
                </h2>
                <p className="text-xs text-on-surface-variant dark:text-slate-300 leading-relaxed max-w-md mx-auto">
                  {t(
                    "chat.welcomeSubtitle",
                    "Soy tu asesor de IA para becas completas, visas de trabajo, búsqueda de empleo y migración con o sin familia."
                  )}
                </p>
              </div>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left pt-2">
                {promptSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={item.action}
                    className="p-4 rounded-2xl bg-surface dark:bg-slate-900 border border-outline-variant/40 dark:border-slate-800 hover:border-secondary transition-all space-y-1 group cursor-pointer text-left hover:shadow-xs"
                  >
                    <span className="font-bold text-xs text-primary dark:text-sky-300 block group-hover:text-secondary">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-on-surface-variant dark:text-slate-400 block line-clamp-2 leading-relaxed">
                      {item.subtitle}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages Thread */
            activeConv.messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3.5 max-w-3xl ${
                    isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                      isUser
                        ? "bg-primary text-white"
                        : "bg-secondary-container/50 dark:bg-teal-500/20 text-secondary dark:text-teal-300"
                    }`}
                  >
                    {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl p-4 md:p-5 text-xs md:text-sm space-y-3 leading-relaxed shadow-xs ${
                      isUser
                        ? "bg-primary text-white rounded-tr-xs"
                        : "bg-surface dark:bg-slate-900 text-on-surface dark:text-slate-100 border border-outline-variant/30 dark:border-slate-800 rounded-tl-xs"
                    }`}
                  >
                    <div className="whitespace-pre-line font-body-md leading-relaxed">
                      {msg.content}
                    </div>

                    {/* Sources Section if provided */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-3 border-t border-outline-variant/20 dark:border-slate-800 space-y-1.5">
                        <span className="text-[11px] font-bold text-secondary dark:text-teal-300 uppercase tracking-wider block">
                          {language === "en"
                            ? "Recommended Official Sources"
                            : "Fuentes Oficiales Recomendadas"}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {msg.sources.map((src, idx) => (
                            <a
                              key={idx}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 bg-surface-container dark:bg-slate-800 px-2.5 py-1 rounded-lg text-xs font-medium text-primary dark:text-sky-300 hover:underline"
                            >
                              <span>{src.title}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer Actions for Assistant */}
                    {!isUser && (
                      <div className="flex items-center justify-between text-xs text-on-surface-variant dark:text-slate-400 pt-1">
                        <span>{msg.timestamp}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="p-1 hover:text-primary dark:hover:text-sky-300 transition-colors cursor-pointer"
                            title="Copiar respuesta"
                          >
                            {copiedIndex === msg.id ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-3 text-sm text-on-surface-variant dark:text-slate-400">
              <div className="w-9 h-9 rounded-xl bg-secondary-container/50 dark:bg-teal-500/20 text-secondary dark:text-teal-300 flex items-center justify-center animate-pulse">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-surface dark:bg-slate-900 px-4 py-3 rounded-2xl border border-outline-variant/30 dark:border-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                <span className="font-semibold text-xs">
                  {language === "en"
                    ? "LatinoMigra AI is evaluating migration pathways..."
                    : "LatinoMigra IA está analizando opciones para tu perfil..."}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Box Footer */}
        <div className="p-4 bg-surface-container-lowest dark:bg-slate-800 border-t border-outline-variant/30 dark:border-slate-700 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 md:gap-3 bg-surface dark:bg-slate-900 p-2.5 rounded-2xl border border-outline-variant/60 dark:border-slate-700 focus-within:border-secondary dark:focus-within:border-teal-400"
          >
            <button
              type="button"
              onClick={() => setShowProfileDiagnosisModal(true)}
              className="p-2 text-secondary dark:text-teal-400 hover:bg-secondary/10 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Evaluar Perfil Completo"
            >
              <Compass className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t(
                "chat.inputPlaceholder",
                "Pregunta sobre visas, requisitos o becas específicas..."
              )}
              id="chat-input-field"
              className="flex-1 bg-transparent border-none outline-none text-xs md:text-sm text-on-surface dark:text-slate-100 placeholder:text-on-surface-variant dark:placeholder:text-slate-500"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              id="send-chat-msg-btn"
              className="bg-primary dark:bg-sky-600 hover:bg-primary-container disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[11px] text-center text-on-surface-variant dark:text-slate-500">
            {t(
              "chat.disclaimer",
              "LatinoMigra IA es una guía orientativa. Verifica siempre la información oficial en los consulados correspondientes."
            )}
          </p>
        </div>
      </main>

      {/* Profile Diagnosis Modal (Career + Age + Family + Goal Form) */}
      {showProfileDiagnosisModal && (
        <Modal
          open={showProfileDiagnosisModal}
          onOpenChange={(next) => {
            if (!next) setShowProfileDiagnosisModal(false);
          }}
          title={
            language === "en"
              ? "AI Migration Profile Diagnosis"
              : "Diagnóstico de Perfil Migratorio con IA"
          }
          size="lg"
          header={
            <div className="border-b border-outline-variant/30 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-secondary/15 dark:bg-teal-500/20 text-secondary dark:text-teal-300 flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-headline-md text-lg font-bold text-primary dark:text-sky-300">
                    {language === "en"
                      ? "AI Migration Profile Diagnosis"
                      : "Diagnóstico de Perfil Migratorio con IA"}
                  </h3>
                  <p className="text-xs text-on-surface-variant dark:text-slate-400">
                    {language === "en"
                      ? "Tell the AI your career, age and family status to get tailored recommendations"
                      : "Indica tu carrera, edad y familia para recibir las mejores opciones y visas"}
                  </p>
                </div>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* País de Origen */}
            <div>
              <label className="block font-bold text-primary dark:text-sky-300 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-secondary" />
                <span>{language === "en" ? "Country of Origin" : "País de Origen"}</span>
              </label>
              <select
                value={diagOrigin}
                onChange={(e) => setDiagOrigin(e.target.value)}
                className="w-full p-2.5 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 font-medium focus:ring-2 focus:ring-secondary outline-none dark:text-slate-100"
              >
                <option value="Colombia">🇨🇴 Colombia</option>
                <option value="México">🇲🇽 México</option>
                <option value="Perú">🇵🇪 Perú</option>
                <option value="Argentina">🇦🇷 Argentina</option>
                <option value="Chile">🇨🇱 Chile</option>
                <option value="Ecuador">🇪🇨 Ecuador</option>
                <option value="Venezuela">🇻🇪 Venezuela</option>
                <option value="Bolivia">🇧🇴 Bolivia</option>
                <option value="Guatemala">🇬🇹 Guatemala</option>
                <option value="Costa Rica">🇨🇷 Costa Rica</option>
              </select>
            </div>

            {/* Carrera y Edad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-primary dark:text-sky-300 mb-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-secondary" />
                  <span>{language === "en" ? "Career / Profession" : "Carrera o Profesión"}</span>
                </label>
                <select
                  value={diagCareer}
                  onChange={(e) => setDiagCareer(e.target.value)}
                  className="w-full p-2.5 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 font-medium focus:ring-2 focus:ring-secondary outline-none dark:text-slate-100"
                >
                  <option value="Ingeniería de Software / IT">
                    Ingeniería de Software / IT / Datos
                  </option>
                  <option value="Medicina / Enfermería / Salud">
                    Medicina / Enfermería / Salud
                  </option>
                  <option value="Administración / Finanzas / Negocios">
                    Administración / Negocios / Finanzas
                  </option>
                  <option value="Ingeniería Industrial / Civil / Mecánica">
                    Ingeniería Industrial / Civil / Mecánica
                  </option>
                  <option value="Educación / Docencia / Idiomas">
                    Educación / Docencia / Idiomas
                  </option>
                  <option value="Marketing / Diseño / Comunicación">
                    Marketing / Diseño / Comunicación
                  </option>
                  <option value="Derecho / Ciencias Sociales">Derecho / Ciencias Sociales</option>
                  <option value="Gastronomía / Turismo / Hostelería">
                    Gastronomía / Turismo / Hostelería
                  </option>
                  <option value="Oficios Técnicos / Electricidad / Construcción">
                    Oficios Técnicos / Electricidad
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-primary dark:text-sky-300 mb-1 flex items-center justify-between">
                  <span>{language === "en" ? "Age" : "Edad"}</span>
                  <span className="text-secondary dark:text-teal-300 font-bold">
                    {diagAge} años
                  </span>
                </label>
                <input
                  type="range"
                  min={18}
                  max={60}
                  value={diagAge}
                  onChange={(e) => setDiagAge(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-secondary mt-2"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>18</span>
                  <span>30 (Puntajes DAAD/Chancenkarte)</span>
                  <span>60</span>
                </div>
              </div>
            </div>

            {/* Situación Familiar */}
            <div>
              <label className="block font-bold text-primary dark:text-sky-300 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-secondary" />
                <span>{language === "en" ? "Family Status" : "Situación Familiar"}</span>
              </label>
              <select
                value={diagFamily}
                onChange={(e) => setDiagFamily(e.target.value)}
                className="w-full p-2.5 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 font-medium focus:ring-2 focus:ring-secondary outline-none dark:text-slate-100"
              >
                <option value="Soltero/a sin hijos">🧍 Soltero/a sin hijos</option>
                <option value="En pareja sin hijos">👫 En pareja sin hijos</option>
                <option value="Familia con 1 hijo">👨‍👩‍👧 Familia con 1 hijo</option>
                <option value="Familia con 2 o más hijos">👨‍👩‍👧‍👦 Familia con 2 o más hijos</option>
              </select>
            </div>

            {/* Idiomas Conocidos (Multilingüe) */}
            <div className="space-y-2">
              <label className="block font-bold text-primary dark:text-sky-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-secondary" />
                  <span>
                    {language === "en"
                      ? "Known Languages (Multilingual Profile)"
                      : "Idiomas que dominas (Perfil Multilingüe)"}
                  </span>
                </span>
                <span className="text-[11px] font-normal text-slate-500">
                  Selecciona todos los que apliquen
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-surface dark:bg-slate-900/80 p-3 rounded-2xl border border-outline-variant/40 dark:border-slate-700/60 max-h-48 overflow-y-auto">
                {userLanguages.map((item, idx) => (
                  <div
                    key={item.name}
                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                      item.enabled
                        ? "bg-secondary/10 dark:bg-teal-950/40 border-secondary/40 text-primary dark:text-teal-200 font-semibold"
                        : "bg-surface-container/40 dark:bg-slate-800/40 border-outline-variant/30 text-on-surface-variant/70 dark:text-slate-400 opacity-80"
                    }`}
                  >
                    <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={(e) => {
                          const updated = [...userLanguages];
                          updated[idx].enabled = e.target.checked;
                          setUserLanguages(updated);
                        }}
                        className="rounded text-secondary focus:ring-secondary w-3.5 h-3.5 accent-secondary cursor-pointer"
                      />
                      <span>{item.name}</span>
                    </label>

                    {item.enabled && (
                      <select
                        value={item.level}
                        onChange={(e) => {
                          const updated = [...userLanguages];
                          updated[idx].level = e.target.value;
                          setUserLanguages(updated);
                        }}
                        className="text-[11px] py-0.5 px-1.5 bg-surface dark:bg-slate-800 border border-outline-variant/50 rounded-lg outline-none text-on-surface dark:text-slate-200"
                      >
                        <option value="Básico (A1/A2)">A1/A2</option>
                        <option value="Intermedio (B1/B2)">B1/B2</option>
                        <option value="Avanzado (C1/C2)">C1/C2</option>
                        <option value="Nativo / C2">Nativo</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Presupuesto y Objetivo Principal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-primary dark:text-sky-300 mb-1 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-secondary" />
                  <span>
                    {language === "en"
                      ? `Available Budget (${currency})`
                      : `Presupuesto o Ahorro (${currency})`}
                  </span>
                </label>
                <select
                  value={diagBudgetTier}
                  onChange={(e) => setDiagBudgetTier(e.target.value as any)}
                  className="w-full p-2.5 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 font-medium focus:ring-2 focus:ring-secondary outline-none dark:text-slate-100"
                >
                  <option value="low">
                    Menos de {formatCurrency(2000, currency)} (Prioridad Becas 100%)
                  </option>
                  <option value="medium">
                    {formatCurrency(3000, currency)} - {formatCurrency(8000, currency)}
                  </option>
                  <option value="high">
                    {formatCurrency(8000, currency)} - {formatCurrency(15000, currency)} (Sperrkonto
                    / Cursos)
                  </option>
                  <option value="premium">
                    Más de {formatCurrency(15000, currency)} (Estudios familiares)
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-primary dark:text-sky-300 mb-1 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-secondary" />
                  <span>{language === "en" ? "Main Goal" : "Meta Principal"}</span>
                </label>
                <select
                  value={diagGoal}
                  onChange={(e) => setDiagGoal(e.target.value)}
                  className="w-full p-2.5 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 font-medium focus:ring-2 focus:ring-secondary outline-none dark:text-slate-100"
                >
                  <option value="Beca de Maestría o Posgrado 100% financiada">
                    🎓 Beca 100% (DAAD, Carolina, Erasmus)
                  </option>
                  <option value="Trabajo directo o Visa de Oportunidades">
                    💼 Empleo directo / Visa Oportunidades
                  </option>
                  <option value="Curso de Idiomas con Trabajo (Stamp 2 / Co-op)">
                    🗣️ Curso de Idiomas con permiso laboral
                  </option>
                  <option value="Nacionalidad en 2 años (España para latinos)">
                    🇪🇸 Nacionalidad en 2 años (España)
                  </option>
                  <option value="Nómada Digital / Trabajo Remoto">
                    💻 Nómada Digital / Trabajo remoto
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant/20 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setShowProfileDiagnosisModal(false)}
              className="px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:text-primary dark:hover:text-sky-300 cursor-pointer"
            >
              {language === "en" ? "Cancel" : "Cancelar"}
            </button>
            <button
              type="button"
              onClick={handleRunProfileDiagnosis}
              className="bg-primary dark:bg-sky-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-primary-container dark:hover:bg-sky-500 shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>
                {language === "en" ? "Generate AI Diagnosis" : "Generar Diagnóstico con IA"}
              </span>
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
