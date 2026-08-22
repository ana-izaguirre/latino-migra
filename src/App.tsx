import React, { useState, useEffect } from "react";
import { ChatMessage, NavigationTab, ThemeMode, Scholarship, GoogleUser } from "./types";
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
import { VoluntariadosExplorer } from "./components/VoluntariadosExplorer";
import { AdminDashboard } from "./components/AdminDashboard";
import { FloatingChatWidget } from "./components/FloatingChatWidget";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { ScrollTopBottomButton } from "./components/ScrollTopBottomButton";
import { Footer } from "./components/Footer";
import { AuthModal } from "./components/AuthModal";
import { NotificationSettingsModal } from "./components/NotificationSettingsModal";
import { subscribeToAuthState, getUserProfile, isUserAdmin, signOutUser } from "./lib/firebase";
import {
  attachUser,
  detachUser,
  getPreferences,
  setPreference,
  subscribeToPreferences,
} from "./lib/preferencesStore";
import { isAdmin } from "./lib/authUtils";

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>("home");
  // A stored choice wins; otherwise follow the operating system.
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = getPreferences().theme;
    if (stored) return stored;
    try {
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string>("");
  /** The exchange the floating bubble hands over when it is maximised (#4). */
  const [chatHandover, setChatHandover] = useState<ChatMessage[] | undefined>(undefined);
  const [selectedScholarshipForChat, setSelectedScholarshipForChat] = useState<Scholarship | null>(
    null
  );
  const [alertsModalOpen, setAlertsModalOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Google User Auth State from Firebase Auth & Firestore
  const [currentUser, setCurrentUser] = useState<GoogleUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  // Listen to Firebase Auth state changes safely and sync profile from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (fbUser) => {
      if (fbUser) {
        try {
          const [profile, admin] = await Promise.all([
            getUserProfile(fbUser.uid),
            isUserAdmin(fbUser.uid),
          ]);
          const userData: GoogleUser = {
            id: fbUser.uid,
            // A missing field stays missing. `Avatar` renders the initial when
            // there is no picture, rather than a stranger's photograph (#99).
            name: fbUser.displayName || profile?.displayName || "",
            email: fbUser.email || profile?.email || "",
            avatar: fbUser.photoURL || profile?.photoURL || "",
            countryOfOrigin: profile?.countryOfOrigin || "Colombia",
            // Never `profile?.role`: that document is writable by its owner.
            isAdmin: admin,
            signedInAt: new Date().toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          };
          setCurrentUser(userData);
          // Moves anything the cookie holds into the account and clears it.
          await attachUser(fbUser.uid);
        } catch (e) {
          console.error("Error fetching user profile from Firestore:", e);
        }
      } else {
        detachUser();
        // Firebase is the only source of a session. This used to keep any user
        // whose id started with `google-user-` — the prefix of the fabricated
        // "Invitada" identity AuthModal handed out when the popup failed — so
        // the application held a session Firebase had never issued.
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Leave the admin tab as soon as the user is not an administrator: on sign
  // out, or when an admin entry is revoked while the panel is open. The render
  // below is guarded too, so the panel never paints for an unauthorised user
  // in the frame before this runs.
  useEffect(
    () =>
      subscribeToPreferences((prefs) => {
        if (prefs.theme) setTheme(prefs.theme);
      }),
    []
  );

  useEffect(() => {
    if (activeTab === "admin" && !isAdmin(currentUser)) {
      setActiveTab("home");
    }
  }, [activeTab, currentUser]);

  // Apply dark mode class to HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  }, [theme]);

  const toggleTheme = () => {
    // Computed outside the updater: `setPreference` notifies subscribers
    // synchronously, and running that inside a state updater fires a side
    // effect during render.
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    setPreference("theme", next);
  };

  const handleSignIn = (user: GoogleUser) => {
    setCurrentUser(user);
    setAuthModalOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.info("Signout error:", e);
    }
    setCurrentUser(null);
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
    <div className="min-h-screen bg-surface font-body-md text-on-surface dark:bg-slate-950 dark:text-slate-100 transition-colors flex flex-col justify-between relative pb-bottom-nav">
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
        onOpenAlertsModal={() => setAlertsModalOpen(true)}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
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
              currentUser={currentUser}
              onOpenAuthModal={() => setAuthModalOpen(true)}
            />
          </main>
        )}

        {activeTab === "planificador" && (
          <main className="animate-fade-in">
            <PlanificadorMigracion
              setActiveTab={setActiveTab}
              currentUser={currentUser}
              onAskAIWithCustomPrompt={(prompt) => {
                setChatInitialPrompt(prompt);
                setActiveTab("chat");
              }}
            />
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
              currentUser={currentUser}
              onOpenAuthModal={() => setAuthModalOpen(true)}
            />
          </main>
        )}

        {activeTab === "voluntariados" && (
          <main className="animate-fade-in">
            <VoluntariadosExplorer
              setActiveTab={setActiveTab}
              onAskAIWithCustomPrompt={(prompt) => {
                setChatInitialPrompt(prompt);
                setActiveTab("chat");
              }}
              currentUser={currentUser}
            />
          </main>
        )}

        {activeTab === "admin" && isAdmin(currentUser) && (
          <main className="animate-fade-in">
            <AdminDashboard currentUser={currentUser} setActiveTab={setActiveTab} />
          </main>
        )}

        {activeTab === "guia" && (
          <main className="animate-fade-in">
            <GuiaMigracion setActiveTab={setActiveTab} onAskAIAboutGuide={handleAskAIAboutGuide} />
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
              initialHistory={chatHandover}
              scholarshipContext={selectedScholarshipForChat}
            />
          </main>
        )}
      </div>

      {/* Floating Popup Chatbot */}
      <FloatingChatWidget
        currentUser={currentUser}
        onNavigateToFullChat={(prompt, history) => {
          setChatHandover(history);
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

      {/* Migration & Scholarship Alerts Center Modal */}
      <NotificationSettingsModal
        isOpen={alertsModalOpen}
        onClose={() => setAlertsModalOpen(false)}
        currentUser={currentUser}
      />

      {/* Shared Footer */}
      <Footer setActiveTab={setActiveTab} />

      {/* Primary navigation for touch layouts (hidden from lg upwards) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMenu={() => setMobileMenuOpen(true)}
      />
    </div>
  );
}
