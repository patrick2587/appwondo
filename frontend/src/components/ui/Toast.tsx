"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Zustand Store                                                      */
/* ------------------------------------------------------------------ */

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (type, message) => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

/* ------------------------------------------------------------------ */
/*  Single Toast                                                       */
/* ------------------------------------------------------------------ */

const typeConfig: Record<
  ToastType,
  { icon: React.ElementType; bg: string; border: string; text: string }
> = {
  success: {
    icon: CheckCircle,
    bg: "bg-green-50",
    border: "border-green-400",
    text: "text-green-800",
  },
  error: {
    icon: AlertCircle,
    bg: "bg-red-50",
    border: "border-red-400",
    text: "text-red-800",
  },
  info: {
    icon: Info,
    bg: "bg-blue-50",
    border: "border-blue-400",
    text: "text-blue-800",
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToastStore();
  const config = typeConfig[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 shadow-md animate-in slide-in-from-right",
        config.bg,
        config.border
      )}
      role="alert"
    >
      <Icon className={cn("h-5 w-5 shrink-0", config.text)} />
      <p className={cn("text-sm font-medium", config.text)}>{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className={cn(
          "ml-auto shrink-0 rounded p-0.5 transition-colors hover:bg-black/5",
          config.text
        )}
        aria-label="Schliessen"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Container                                                          */
/* ------------------------------------------------------------------ */

export function ToastContainer() {
  const { toasts } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
