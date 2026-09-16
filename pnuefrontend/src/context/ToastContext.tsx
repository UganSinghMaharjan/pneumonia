"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success", title?: string, duration = 3500) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string, duration?: number) => showToast(message, "success", title, duration),
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string, duration?: number) => showToast(message, "error", title, duration),
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string, duration?: number) => showToast(message, "warning", title, duration),
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string, duration?: number) => showToast(message, "info", title, duration),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col space-y-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start p-4 rounded-xl border shadow-lg transition-all duration-300 animate-in slide-in-from-top-3 fade-in ${
              t.type === "success"
                ? "bg-emerald-950/90 border-emerald-700/50 text-emerald-100 backdrop-blur-md"
                : t.type === "error"
                ? "bg-rose-950/90 border-rose-700/50 text-rose-100 backdrop-blur-md"
                : t.type === "warning"
                ? "bg-amber-950/90 border-amber-700/50 text-amber-100 backdrop-blur-md"
                : "bg-indigo-950/90 border-indigo-700/50 text-indigo-100 backdrop-blur-md"
            }`}
          >
            <div className="shrink-0 mt-0.5 mr-3">
              {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {t.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {t.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {t.type === "info" && <Info className="w-5 h-5 text-indigo-400" />}
            </div>

            <div className="flex-1 pr-2">
              {t.title && <h5 className="text-xs font-bold uppercase tracking-wider mb-0.5 opacity-90">{t.title}</h5>}
              <p className="text-sm font-medium leading-snug">{t.message}</p>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-1 text-slate-400 hover:text-white transition-colors rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
