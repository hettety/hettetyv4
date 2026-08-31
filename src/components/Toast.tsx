import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  type?: ToastType;
  message: string;
  description?: string;
  duration?: number;
  id?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastItem extends ToastOptions {
  id: string;
  type: ToastType;
  createdAt: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (options: ToastOptions | string, type?: ToastType) => string;
  success: (message: string, description?: string, duration?: number) => string;
  error: (message: string, description?: string, duration?: number) => string;
  info: (message: string, description?: string, duration?: number) => string;
  warning: (message: string, description?: string, duration?: number) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Event emitter for optional standalone/global dispatch
type ToastEventListener = (toast: ToastItem) => void;
const listeners = new Set<ToastEventListener>();

export const toast = {
  show: (options: ToastOptions | string, type: ToastType = 'info') => {
    const opts: ToastOptions = typeof options === 'string' ? { message: options, type } : options;
    const item: ToastItem = {
      id: opts.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: opts.type || type,
      message: opts.message,
      description: opts.description,
      duration: opts.duration ?? 4000,
      action: opts.action,
      createdAt: Date.now(),
    };
    listeners.forEach((l) => l(item));
    return item.id;
  },
  success: (message: string, description?: string, duration?: number) =>
    toast.show({ message, description, type: 'success', duration }),
  error: (message: string, description?: string, duration?: number) =>
    toast.show({ message, description, type: 'error', duration }),
  info: (message: string, description?: string, duration?: number) =>
    toast.show({ message, description, type: 'info', duration }),
  warning: (message: string, description?: string, duration?: number) =>
    toast.show({ message, description, type: 'warning', duration }),
};

const toastConfig: Record<
  ToastType,
  {
    icon: React.ComponentType<{ className?: string; size?: number }>;
    bgLight: string;
    bgDark: string;
    borderLight: string;
    borderDark: string;
    textColor: string;
    iconColor: string;
    accentColor: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    bgLight: 'bg-emerald-50/95',
    bgDark: 'dark:bg-slate-900/95',
    borderLight: 'border-emerald-200/80',
    borderDark: 'dark:border-emerald-500/30',
    textColor: 'text-emerald-950 dark:text-emerald-100',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    accentColor: 'bg-emerald-500',
  },
  error: {
    icon: AlertCircle,
    bgLight: 'bg-rose-50/95',
    bgDark: 'dark:bg-slate-900/95',
    borderLight: 'border-rose-200/80',
    borderDark: 'dark:border-rose-500/30',
    textColor: 'text-rose-950 dark:text-rose-100',
    iconColor: 'text-rose-600 dark:text-rose-400',
    accentColor: 'bg-rose-500',
  },
  warning: {
    icon: AlertTriangle,
    bgLight: 'bg-amber-50/95',
    bgDark: 'dark:bg-slate-900/95',
    borderLight: 'border-amber-200/80',
    borderDark: 'dark:border-accent-500/30',
    textColor: 'text-amber-950 dark:text-amber-100',
    iconColor: 'text-accent-500 dark:text-accent-400',
    accentColor: 'bg-accent-500',
  },
  info: {
    icon: Info,
    bgLight: 'bg-brand-50/95',
    bgDark: 'dark:bg-slate-900/95',
    borderLight: 'border-brand-200/80',
    borderDark: 'dark:border-brand-500/30',
    textColor: 'text-brand-950 dark:text-brand-100',
    iconColor: 'text-brand-600 dark:text-brand-400',
    accentColor: 'bg-brand-500',
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (options: ToastOptions | string, type: ToastType = 'info'): string => {
      const opts: ToastOptions = typeof options === 'string' ? { message: options, type } : options;
      const id = opts.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newToast: ToastItem = {
        id,
        type: opts.type || type,
        message: opts.message,
        description: opts.description,
        duration: opts.duration ?? 4000,
        action: opts.action,
        createdAt: Date.now(),
      };

      setToasts((prev) => [...prev, newToast]);
      return id;
    },
    []
  );

  const success = useCallback(
    (message: string, description?: string, duration?: number) =>
      showToast({ message, description, type: 'success', duration }),
    [showToast]
  );

  const error = useCallback(
    (message: string, description?: string, duration?: number) =>
      showToast({ message, description, type: 'error', duration }),
    [showToast]
  );

  const info = useCallback(
    (message: string, description?: string, duration?: number) =>
      showToast({ message, description, type: 'info', duration }),
    [showToast]
  );

  const warning = useCallback(
    (message: string, description?: string, duration?: number) =>
      showToast({ message, description, type: 'warning', duration }),
    [showToast]
  );

  useEffect(() => {
    const handler: ToastEventListener = (t) => {
      setToasts((prev) => [...prev, t]);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        success,
        error,
        info,
        warning,
        removeToast,
        clearAll,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Return fallback bound to global emitter
    return {
      toasts: [],
      showToast: toast.show,
      success: toast.success,
      error: toast.error,
      info: toast.info,
      warning: toast.warning,
      removeToast: () => {},
      clearAll: () => {},
    };
  }
  return ctx;
};

export const ToastContainer: React.FC<{
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 max-w-[90vw] sm:max-w-md w-full pointer-events-none px-4"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export const ToastCard: React.FC<{
  item: ToastItem;
  onDismiss: (id: string) => void;
}> = ({ item, onDismiss }) => {
  const config = toastConfig[item.type] || toastConfig.info;
  const Icon = config.icon;

  useEffect(() => {
    if (item.duration && item.duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(item.id);
      }, item.duration);
      return () => clearTimeout(timer);
    }
  }, [item.id, item.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 15, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      role="alert"
      className={`pointer-events-auto w-full backdrop-blur-xl rounded-2xl p-4 shadow-2xl border transition-colors duration-300 flex items-start gap-3.5 ${config.bgLight} ${config.bgDark} ${config.borderLight} ${config.borderDark} ${config.textColor}`}
    >
      <div className={`p-1 rounded-xl shrink-0 mt-0.5 ${config.iconColor}`}>
        <Icon size={20} className="stroke-[2.2]" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-snug">{item.message}</p>
        {item.description && (
          <p className="text-xs mt-1 opacity-85 leading-relaxed font-medium">
            {item.description}
          </p>
        )}
        {item.action && (
          <button
            onClick={() => {
              item.action?.onClick();
              onDismiss(item.id);
            }}
            className="mt-2 text-xs font-black underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            {item.action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
        className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors shrink-0"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};

export default ToastProvider;
