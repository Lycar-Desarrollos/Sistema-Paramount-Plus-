import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Check, Info } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value?: string) => void;
  title: string;
  message: string;
  type?: 'confirm' | 'prompt' | 'danger';
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  isDarkMode?: boolean;
}

export default function CustomDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'confirm',
  defaultValue = '',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDarkMode = true
}: Props) {
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) setInputValue(defaultValue);
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (type === 'prompt') {
      onConfirm(inputValue);
    } else {
      onConfirm();
    }
    onClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'danger': return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'prompt': return <Info className="w-6 h-6 text-brand-500" />;
      default: return <Check className="w-6 h-6 text-emerald-500" />;
    }
  };

  const getConfirmButtonStyles = () => {
    switch (type) {
      case 'danger': return 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20';
      case 'prompt': return 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20';
      default: return 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className={`relative w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 ${
        isDarkMode ? 'bg-[#13131a] border border-white/10' : 'bg-white border border-slate-200'
      }`}>
        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isDarkMode ? 'bg-white/5' : 'bg-slate-50'
            }`}>
              {getIcon()}
            </div>
            <div className="flex-1">
              <h3 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {title}
              </h3>
              <p className={`text-sm mt-1 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {message}
              </p>
            </div>
            <button 
              onClick={onClose}
              className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {type === 'prompt' && (
            <div className="mb-8">
              <input
                type="text"
                autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all font-medium ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/5 focus:border-brand-500 text-white' 
                    : 'bg-slate-50 border-slate-100 focus:border-brand-500 text-slate-900'
                }`}
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${getConfirmButtonStyles()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
