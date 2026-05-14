import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </ToastContext.Provider>
  );
};

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const COLORS = {
  success: { border: 'border-emerald-500/30', icon: 'text-emerald-400', bg: 'bg-emerald-500/10', bar: 'bg-emerald-500' },
  error:   { border: 'border-red-500/30',     icon: 'text-red-400',     bg: 'bg-red-500/10',     bar: 'bg-red-500'     },
  info:    { border: 'border-brand-500/30',   icon: 'text-brand-400',   bg: 'bg-brand-500/10',   bar: 'bg-brand-500'   },
};

const ToastContainer: React.FC<{ toasts: Toast[]; onDismiss: (id: string) => void }> = ({ toasts, onDismiss }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => {
          const Icon = ICONS[toast.type];
          const c = COLORS[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className={`pointer-events-auto relative overflow-hidden flex items-center gap-3 pl-4 pr-10 py-3.5 rounded-2xl border shadow-2xl min-w-[280px] max-w-[380px] ${c.border} ${
                isDarkMode ? 'bg-[#13131a]/95 backdrop-blur-xl text-white' : 'bg-white/95 backdrop-blur-xl text-slate-900 shadow-slate-200'
              }`}
            >
              {/* Accent bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.bar} rounded-l-2xl`} />

              {/* Icon bubble */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg}`}>
                <Icon className={`w-4 h-4 ${c.icon}`} />
              </div>

              <p className="text-sm font-semibold flex-1 leading-snug">{toast.message}</p>

              {/* Dismiss */}
              <button
                onClick={() => onDismiss(toast.id)}
                className="absolute right-2.5 top-2.5 p-1 rounded-lg opacity-40 hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Progress bar */}
              <motion.div
                className={`absolute bottom-0 left-0 h-0.5 ${c.bar} opacity-40`}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 3.5, ease: 'linear' }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
