import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronDown, Download, ExternalLink } from "lucide-react";
import {
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  downloadIcsFile,
  CalendarEventOptions,
} from "../lib/googleCalendar";

interface CalendarAgendaButtonProps {
  event: CalendarEventOptions;
  label?: string;
  variant?: "primary" | "secondary" | "outline" | "compact";
  className?: string;
}

export const CalendarAgendaButton: React.FC<CalendarAgendaButtonProps> = ({
  event,
  label = "Agendar en Calendario",
  variant = "primary",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGoogle = () => {
    window.open(generateGoogleCalendarUrl(event), "_blank");
    setIsOpen(false);
  };

  const handleOutlook = () => {
    window.open(generateOutlookCalendarUrl(event), "_blank");
    setIsOpen(false);
  };

  const handleAppleIcs = () => {
    downloadIcsFile(event);
    setIsOpen(false);
  };

  const getButtonStyles = () => {
    if (variant === "compact") {
      return "bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-1.5 rounded-lg font-semibold";
    }
    if (variant === "outline") {
      return "bg-surface-container-lowest dark:bg-slate-800 hover:bg-surface-container text-on-surface dark:text-slate-200 border border-outline-variant/60 dark:border-slate-700 text-xs px-3.5 py-2 rounded-xl font-semibold";
    }
    if (variant === "secondary") {
      return "bg-secondary dark:bg-teal-600 hover:bg-secondary/90 text-white text-xs px-3.5 py-2 rounded-xl font-bold shadow-sm";
    }
    return "bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-2 rounded-xl font-bold shadow-sm";
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 transition-all cursor-pointer ${getButtonStyles()}`}
        title="Añadir recordatorio a tu calendario"
      >
        <CalendarIcon className="w-3.5 h-3.5" />
        <span>{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full sm:bottom-auto sm:top-full mb-2 sm:mb-0 sm:mt-2 w-64 bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/60 dark:border-slate-700 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-fade-in text-xs">
          <div className="px-3 py-1.5 font-bold text-on-surface-variant dark:text-slate-400 border-b border-outline-variant/30 dark:border-slate-800 text-[11px] uppercase tracking-wider">
            Selecciona tu Calendario
          </div>

          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-on-surface dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">📅</span>
              <div>
                <p className="font-bold text-primary dark:text-sky-300">Google Calendar</p>
                <p className="text-[10px] text-on-surface-variant dark:text-slate-400">
                  Abrir en navegador o app
                </p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-on-surface-variant" />
          </button>

          <button
            onClick={handleAppleIcs}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-on-surface dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">🍎</span>
              <div>
                <p className="font-bold text-primary dark:text-sky-300">Apple Calendar / iCal</p>
                <p className="text-[10px] text-on-surface-variant dark:text-slate-400">
                  Descargar archivo .ics
                </p>
              </div>
            </div>
            <Download className="w-3.5 h-3.5 text-on-surface-variant" />
          </button>

          <button
            onClick={handleOutlook}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-on-surface dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">✉️</span>
              <div>
                <p className="font-bold text-primary dark:text-sky-300">Outlook / Office 365</p>
                <p className="text-[10px] text-on-surface-variant dark:text-slate-400">
                  Abrir en Outlook Web
                </p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-on-surface-variant" />
          </button>
        </div>
      )}
    </div>
  );
};
