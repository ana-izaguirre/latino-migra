import React, { useState, useEffect } from "react";
import { NavigationTab, ThemeMode, Scholarship, GoogleUser } from "./types";
import { TopNavBar } from "./components/TopNavBar";
import { HeroLanding } from "./components/HeroLanding";
import { BecasExplorer } from "./components/BecasExplorer";
import { GuiaMigracion } from "./components/GuiaMigracion";
import { MapaConsulados } from "./components/MapaConsulados";
import { ChatIA } from "./components/ChatIA";
import { Comunidad } from "./components/Comunidad";
import { PlanificadorMigracion } from "./components/PlanificadorMigracion";
import { FeedbackHub } from "./components/FeedbackHub";
import { CalculadoraCostoVida } from "./components/CalculadoraCostoVida";
import { FloatingChatWidget } from "./components/FloatingChatWidget";
import { ScrollTopBottomButton } from "./components/ScrollTopBottomButton";
import { Footer } from "./components/Footer";
import { AuthModal } from "./components/AuthModal";

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>("home");
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem("latinomigra_theme");
      if (saved === "light" || saved === "dark") return saved;
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {
      return "light";
    }
  });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string>("");
  const [selectedScholarshipForChat, setSelectedScholarshipForChat] = useState<Scholarship | null>(null);

  // Google User Auth State
  const [currentUser, setCurrentUser] = useState<GoogleUser | null>(() => {
    try {
      const saved = localStorage.getItem("latinomigra_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  // Apply dark mode class to HTML element and persist
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
    try {
      localStorage.setItem("latinomigra_theme", theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleSignIn = (user: GoogleUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("latinomigra_user", JSON.stringify(user));
    } catch {}
    setAuthModalOpen(false);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem("latinomigra_user");
    } catch {}
  };

  const handleAskAIAboutScholarship = (scholarship: Scholarship) => {
    setSelectedScholarshipForChat(scholarship);
    setChatInitialPrompt(
      `Quiero consultar información detallada y consejos para postular a la beca: "${scholarship.title}" de ${scholarship.institution} en ${scholarship.country}. ¿Cuáles son las claves para destacar en la postulación?`
    );
    setActiveTab("chat");
  };

  const handleAskAIAboutGuide = (countryName: string, visaName?: string) => {
    if (visaName) {
      setChatInitialPrompt(
        `Quiero saber los detalles exactos, requisitos financieros y documentos para la visa "${visaName}" en ${countryName}.`
      );
    } else {
      setChatInitialPrompt(
        `¿Cuál es la mejor visa para estudiar o trabajar en ${countryName} siendo ciudadano latinoamericano?`
      );
    }
    setActiveTab("chat");
  };

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface dark:bg-slate-950 dark:text-slate-100 transition-colors flex flex-col justify-between relative">
      {/* Top Navigation */}
      <TopNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentUser={currentUser}
        onOpenAuthModal={() => setAuthModalOpen(true)}
      />

      {/* Dynamic Tab Views */}
      <div className="flex-1">
        {activeTab === "home" && (
          <main className="animate-fade-in">
            <HeroLanding setActiveTab={setActiveTab} currentUser={currentUser} />
            <BecasExplorer
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setActiveTab={setActiveTab}
              onAskAIAboutScholarship={handleAskAIAboutScholarship}
            />
          </main>
        )}

        {activeTab === "planificador" && (
          <main className="animate-fade-in">
            <PlanificadorMigracion setActiveTab={setActiveTab} currentUser={currentUser} />
          </main>
        )}

        {activeTab === "calculadora" && (
          <main className="animate-fade-in">
            <CalculadoraCostoVida
              setActiveTab={setActiveTab}
              currentUser={currentUser}
              onAskAIAboutBudget={(prompt) => {
                setChatInitialPrompt(prompt);
                setActiveTab("chat");
              }}
            />
          </main>
        )}

        {activeTab === "becas" && (
          <main className="animate-fade-in">
            <BecasExplorer
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setActiveTab={setActiveTab}
              onAskAIAboutScholarship={handleAskAIAboutScholarship}
            />
          </main>
        )}

        {activeTab === "guia" && (
          <main className="animate-fade-in">
            <GuiaMigracion
              setActiveTab={setActiveTab}
              onAskAIAboutGuide={handleAskAIAboutGuide}
            />
          </main>
        )}

        {activeTab === "mapa" && (
          <main className="animate-fade-in">
            <MapaConsulados />
          </main>
        )}

        {activeTab === "comunidad" && (
          <main className="animate-fade-in">
            <Comunidad />
          </main>
        )}

        {activeTab === "feedback" && (
          <main className="animate-fade-in">
            <FeedbackHub currentUser={currentUser} onOpenAuthModal={() => setAuthModalOpen(true)} />
          </main>
        )}

        {activeTab === "chat" && (
          <main className="animate-fade-in">
            <ChatIA
              initialPrompt={chatInitialPrompt}
              scholarshipContext={selectedScholarshipForChat}
            />
          </main>
        )}
      </div>

      {/* Floating Popup Chatbot */}
      <FloatingChatWidget
        currentUser={currentUser}
        onNavigateToFullChat={(prompt) => {
          if (prompt) setChatInitialPrompt(prompt);
          setActiveTab("chat");
        }}
      />

      {/* Floating Scroll Top / Bottom Button */}
      <ScrollTopBottomButton />

      {/* Google Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Shared Footer */}
      <Footer setActiveTab={setActiveTab} />
    </div>
  );
}
