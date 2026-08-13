import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Paperclip,
  Sparkles,
  Plus,
  MessageSquare,
  ThumbsUp,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  User,
  Trash2
} from "lucide-react";
import { ChatMessage, ChatConversation, Scholarship } from "../types";

interface ChatIAProps {
  initialPrompt?: string;
  scholarshipContext?: Scholarship | null;
}

export const ChatIA: React.FC<ChatIAProps> = ({ initialPrompt, scholarshipContext }) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([
    {
      id: "conv-1",
      title: "Requisitos visa estudiante España",
      updatedAt: "Hoy, 10:15 AM",
      messages: [
        {
          id: "m-1",
          role: "user",
          content: "¿Cuáles son los requisitos clave para la visa de estudiante de España desde Colombia?",
          timestamp: "10:15 AM"
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
            { title: "Ministerio de Inclusión, Seguridad Social y Migraciones", url: "https://www.inclusion.gob.es" }
          ]
        }
      ]
    },
    {
      id: "conv-2",
      title: "Becas CONACYT para maestría",
      updatedAt: "Ayer",
      messages: []
    },
    {
      id: "conv-3",
      title: "Costo de vida en Buenos Aires vs Madrid",
      updatedAt: "Hace 3 días",
      messages: []
    }
  ]);

  const [activeConvId, setActiveConvId] = useState<string>("conv-1");
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

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
        content: data.text || "No se pudo obtener la respuesta.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: [
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
        content: "Ocurrió un error al conectar con LatinoMigra IA. Por favor, verifica tu conexión o intenta nuevamente.",
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

  const handleNewConversation = () => {
    const newConv: ChatConversation = {
      id: `conv-${Date.now()}`,
      title: "Nueva Consulta",
      updatedAt: "Ahora",
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
      title: "Requisitos visa estudiante España",
      subtitle: "Medios económicos IPREM, seguro y carta de aceptación",
    },
    {
      title: "Becas Medicina y Salud México",
      subtitle: "Convocatorias para posgrados y especialidades",
    },
    {
      title: "Costo de vida en Alemania para latinos",
      subtitle: "Desglose de Sperrkonto, alquiler y transporte",
    },
    {
      title: "Apostilla de la Haya paso a paso",
      subtitle: "Trámites de homologación de títulos universitarios",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 h-[calc(100vh-5rem)] flex flex-col md:flex-row gap-6">
      {/* Left Chat Sidebar */}
      <aside className="w-full md:w-80 bg-surface-container-lowest dark:bg-slate-800 rounded-3xl border border-outline-variant/40 dark:border-slate-700 p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-4">
          <button
            onClick={handleNewConversation}
            id="new-chat-btn"
            className="w-full bg-primary dark:bg-sky-600 hover:bg-primary-container text-white py-3 px-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Nueva Consulta</span>
          </button>

          <div className="space-y-1">
            <span className="text-xs font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider px-2 block">
              Historial de Consultas
            </span>
            <div className="space-y-1 max-h-[50vh] md:max-h-[60vh] overflow-y-auto pr-1">
              {conversations.map((conv) => {
                const isActive = conv.id === activeConvId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`w-full text-left p-3 rounded-xl text-sm transition-colors flex items-center justify-between group ${
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
            <span>Potenciado por Gemini 3.6 Flash</span>
          </div>
        </div>
      </aside>

      {/* Main Chat Conversation Container */}
      <main className="flex-1 bg-surface-container-lowest dark:bg-slate-800 rounded-3xl border border-outline-variant/40 dark:border-slate-700 flex flex-col justify-between overflow-hidden relative">
        {/* Chat Thread Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {activeConv.messages.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-6 py-12">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-sky-900/50 text-primary dark:text-sky-300 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-secondary dark:text-teal-300" />
              </div>

              <div className="space-y-2">
                <h2 className="font-headline-md text-2xl font-extrabold text-primary dark:text-sky-300">
                  ¡Hola, Ana! ¿Cómo puedo ayudarte hoy?
                </h2>
                <p className="text-sm text-on-surface-variant dark:text-slate-300 leading-relaxed">
                  Soy tu asistente experto en visas, becas internacionales, apostillas y trámites migratorios para Latinoamérica.
                </p>
              </div>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left pt-2">
                {promptSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.title)}
                    className="p-4 rounded-2xl bg-surface dark:bg-slate-900 border border-outline-variant/30 dark:border-slate-800 hover:border-secondary transition-all space-y-1 group"
                  >
                    <span className="font-bold text-xs text-primary dark:text-sky-300 block group-hover:text-secondary">
                      {item.title}
                    </span>
                    <span className="text-xs text-on-surface-variant dark:text-slate-400 block line-clamp-1">
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
                    className={`rounded-2xl p-4 md:p-5 text-sm space-y-3 leading-relaxed shadow-xs ${
                      isUser
                        ? "bg-primary text-white rounded-tr-xs"
                        : "bg-surface dark:bg-slate-900 text-on-surface dark:text-slate-100 border border-outline-variant/30 dark:border-slate-800 rounded-tl-xs"
                    }`}
                  >
                    <div className="whitespace-pre-line font-body-md">{msg.content}</div>

                    {/* Sources Section if provided */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-3 border-t border-outline-variant/20 dark:border-slate-800 space-y-1.5">
                        <span className="text-xs font-bold text-secondary dark:text-teal-300 uppercase tracking-wider block">
                          Fuentes Oficiales Recomendadas
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
                            className="p-1 hover:text-primary dark:hover:text-sky-300 transition-colors"
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
                <span className="font-semibold text-xs">LatinoMigra IA está procesando tu respuesta...</span>
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
            className="flex items-center gap-3 bg-surface dark:bg-slate-900 p-2.5 rounded-2xl border border-outline-variant/60 dark:border-slate-700 focus-within:border-secondary dark:focus-within:border-teal-400"
          >
            <button
              type="button"
              className="p-2 text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-sky-300 transition-colors"
              title="Adjuntar currículum o documento"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Pregunta sobre visas, requisitos o becas específicas..."
              id="chat-input-field"
              className="flex-1 bg-transparent border-none outline-none text-sm text-on-surface dark:text-slate-100 placeholder:text-on-surface-variant dark:placeholder:text-slate-500"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              id="send-chat-msg-btn"
              className="bg-primary dark:bg-sky-600 hover:bg-primary-container disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[11px] text-center text-on-surface-variant dark:text-slate-500">
            LatinoMigra IA es una guía orientativa. Verifica siempre la información oficial en los consulados correspondientes.
          </p>
        </div>
      </main>
    </div>
  );
};
