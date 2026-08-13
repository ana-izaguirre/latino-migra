import React, { useState, useEffect } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useLanguage } from "../lib/i18n";

export const ScrollTopBottomButton: React.FC = () => {
  const { language } = useLanguage();
  const [showButton, setShowButton] = useState<boolean>(false);
  const [isNearBottom, setIsNearBottom] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Show floating button when scrolled down more than 250px
      setShowButton(scrollY > 250);

      // Check if user is near the bottom (less than 300px to the bottom)
      const nearBottom = scrollY + windowHeight >= documentHeight - 300;
      setIsNearBottom(nearBottom);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!showButton) return null;

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <div
      id="floating-scroll-navigation"
      className="fixed bottom-24 right-6 z-40 flex flex-col gap-2 bg-surface/90 dark:bg-slate-800/90 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-outline-variant/60 dark:border-slate-700 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
    >
      {/* Scroll to Top */}
      <button
        onClick={scrollToTop}
        id="scroll-to-top-btn"
        title={language === "en" ? "Scroll to Top" : "Subir al inicio"}
        aria-label="Scroll to top"
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-lowest dark:bg-slate-900 text-primary dark:text-sky-300 hover:bg-primary hover:text-white dark:hover:bg-sky-600 dark:hover:text-white transition-all shadow-sm cursor-pointer group"
      >
        <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
      </button>

      {/* Scroll to Bottom (Only if not already at bottom) */}
      {!isNearBottom && (
        <button
          onClick={scrollToBottom}
          id="scroll-to-bottom-btn"
          title={language === "en" ? "Scroll to Bottom" : "Bajar al final"}
          aria-label="Scroll to bottom"
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-lowest dark:bg-slate-900 text-on-surface-variant dark:text-slate-300 hover:bg-secondary hover:text-white dark:hover:bg-teal-600 dark:hover:text-white transition-all shadow-sm cursor-pointer group"
        >
          <ArrowDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
};
