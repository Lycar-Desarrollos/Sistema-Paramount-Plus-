/**
 * NaticBox Admin AI — Centro de Inteligencia Privada
 * ADMIN ONLY — Este componente no se renderiza para colaboradores.
 * El FAB es un botón discreto en la esquina inferior izquierda.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User, Maximize2, Minimize2, Loader2, ChevronDown, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useCampaignStore } from '../store/useCampaignStore';
import { sendToGemini, type GeminiMessage, type NaticContext } from '../services/gemini';

interface AIChatProps {
  userData?: any;
  user?: any;
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  error?: boolean;
}

const WELCOME = '¡Hola! Soy tu asistente privado de NaticBox. Tengo acceso al contexto de tu plataforma. ¿En qué te ayudo?';

const SUGGESTIONS = [
  '¿Cuántos registros tengo en total?',
  'Analiza el estado de mis proyectos',
  '¿Cómo optimizo mi flujo de trabajo?',
  'Sugerencias para organizar mis tablas',
];

export default function AIChat({ userData, user }: AIChatProps) {
  const { isDarkMode } = useTheme();
  const { isAiOpen, setIsAiOpen, projects, tables, records, allUsers } = useCampaignStore();

  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'ai', content: WELCOME }]);
  const [geminiHistory, setGeminiHistory] = useState<GeminiMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [fabPulse, setFabPulse] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check admin status
  const MASTER_ADMIN_UID = 'RXH1eN22BtUAdJBrK4bPR3AxiO52';
  const isMasterAdmin = user?.uid === MASTER_ADMIN_UID;
  const isAdmin = userData?.role === 'admin' || isMasterAdmin;

  console.log('[AIChat] State:', { isAiOpen, isAdmin, userEmail: user?.email, role: userData?.role });

  // If not admin, we truly don't render. 
  // But we allow a small grace period or check by email to be safe.
  if (!isAdmin && user) {
    console.warn('[AIChat] Access denied: User is not admin');
    return null;
  }

  // Pulse effect stops after first open
  useEffect(() => {
    if (isAiOpen) setFabPulse(false);
  }, [isAiOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isAiOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isAiOpen]);

  const buildContext = (): NaticContext => ({
    projectCount: projects.length,
    tableCount: tables.length,
    memberCount: allUsers.length || 1,
    recordCount: records.length,
    activeProject: projects.find(p => p.id === useCampaignStore.getState().activeProjectId)?.name,
    activeTable: tables.find(t => t.id === useCampaignStore.getState().activeTableId)?.name,
  });

  const handleSend = async (overrideText?: string) => {
    const text = overrideText || input.trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    if (!overrideText) setInput('');
    setIsTyping(true);

    try {
      const context = buildContext();
      const { callGenkitAI } = await import('../services/aiGenkit');
      const response = await callGenkitAI(text, context);

      if (response.text.startsWith('❌') || response.text.startsWith('⚠️')) {
        setMessages(prev => [...prev, { role: 'ai', content: response.text, error: true }]);
      } else {
        // Update Gemini history for multi-turn conversation
        setGeminiHistory(prev => [
          ...prev,
          { role: 'user', parts: [{ text }] },
          { role: 'model', parts: [{ text: response.text }] },
        ]);
        setMessages(prev => [...prev, { role: 'ai', content: response.text }]);
      }
    } catch (err: any) {
      console.error('AIChat Error:', err);
      setMessages(prev => [...prev, { role: 'ai', content: '❌ Error crítico al conectar con el servicio de IA.', error: true }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleReset = () => {
    setMessages([{ role: 'ai', content: WELCOME }]);
    setGeminiHistory([]);
    setInput('');
  };

  // ── Secret FAB Removed (Channel is now the Header Toggle) ───────────────────
  if (!isAiOpen) return null;

  // ── Chat Panel ───────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 60, scale: 0.92 }}
        transition={{ type: 'spring', damping: 22, stiffness: 220 }}
        className={`fixed bottom-6 right-6 z-[9999] flex flex-col shadow-2xl rounded-[28px] overflow-hidden border transition-all duration-300 ${
          isExpanded
            ? 'w-[440px] h-[640px] sm:w-[520px] sm:h-[720px]'
            : 'w-[340px] h-[480px] sm:w-[380px] sm:h-[520px]'
        } ${
          isDarkMode
            ? 'bg-[#0f0f13]/97 backdrop-blur-2xl border-white/10 shadow-black/60'
            : 'bg-white/97 backdrop-blur-2xl border-slate-200 shadow-slate-300/40'
        }`}
      >
        {/* Header */}
        <div className={`flex-shrink-0 px-5 py-4 flex items-center justify-between border-b ${
          isDarkMode ? 'border-white/10 bg-gradient-to-r from-brand-600/15 to-indigo-600/15' : 'border-slate-100 bg-gradient-to-r from-brand-50 to-indigo-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0f0f13] rounded-full" />
            </div>
            <div>
              <h3 className={`font-black text-sm flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                NaticBox AI
                <Sparkles className="w-3 h-3 text-brand-400" />
              </h3>
              <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Admin · Privado</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              className={`p-1.5 rounded-xl transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
              title="Nueva conversación"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-1.5 rounded-xl transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
              title={isExpanded ? 'Reducir' : 'Expandir'}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setIsAiOpen(false)}
              className={`p-1.5 rounded-xl transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
              title="Cerrar"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Context pill */}
        <div className={`flex-shrink-0 px-4 py-1.5 flex items-center gap-3 border-b text-[10px] font-bold ${
          isDarkMode ? 'border-white/5 bg-black/20' : 'border-slate-100 bg-slate-50'
        }`}>
          <span className="text-slate-500">{projects.length} proyectos</span>
          <span className={`w-1 h-1 rounded-full ${isDarkMode ? 'bg-white/20' : 'bg-slate-300'}`} />
          <span className="text-slate-500">{tables.length} tablas</span>
          <span className={`w-1 h-1 rounded-full ${isDarkMode ? 'bg-white/20' : 'bg-slate-300'}`} />
          <span className="text-slate-500">{records.length} registros</span>
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar ${isDarkMode ? 'bg-[#0a0a0f]/60' : 'bg-slate-50/60'}`}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                msg.role === 'ai'
                  ? 'bg-gradient-to-br from-brand-500 to-indigo-600 shadow-sm shadow-brand-500/30'
                  : (isDarkMode ? 'bg-slate-800 border border-white/10' : 'bg-white border border-slate-200')
              }`}>
                {msg.role === 'ai'
                  ? <Sparkles className="w-3.5 h-3.5 text-white" />
                  : userData?.photoURL
                    ? <img src={userData.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                    : <User className={`w-3.5 h-3.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`} />
                }
              </div>
              <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-tr-sm'
                  : msg.error
                    ? isDarkMode
                      ? 'bg-red-950/50 text-red-400 border border-red-500/20 rounded-tl-sm'
                      : 'bg-red-50 text-red-600 border border-red-200 rounded-tl-sm'
                    : isDarkMode
                      ? 'bg-[#1a1a24] text-slate-200 border border-white/5 rounded-tl-sm'
                      : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-brand-500 to-indigo-600">
                <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
              </div>
              <div className={`rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 ${
                isDarkMode ? 'bg-[#1a1a24] border border-white/5' : 'bg-white border border-slate-100'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '160ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '320ms' }} />
              </div>
            </div>
          )}

          {/* Suggestions */}
          {messages.length === 1 && !isTyping && (
            <div className="pt-2 space-y-2">
              <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Sugerencias
              </p>
              <div className="space-y-1.5">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    className={`w-full text-left px-3.5 py-2 rounded-xl text-[12px] font-medium transition-all ${
                      isDarkMode
                        ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 hover:border-brand-500/30'
                        : 'bg-white hover:bg-brand-50 text-slate-600 border border-slate-200 hover:border-brand-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`flex-shrink-0 p-3 border-t ${isDarkMode ? 'border-white/10 bg-[#0f0f13]/80' : 'border-slate-100 bg-white/80'}`}>
          <div className={`flex items-center gap-2 rounded-2xl border px-3 py-2 transition-all ${
            isDarkMode
              ? 'bg-[#1a1a24] border-white/10 focus-within:border-brand-500/50'
              : 'bg-slate-50 border-slate-200 focus-within:border-brand-300 focus-within:bg-white'
          }`}>
            <input
              ref={inputRef}
              type="text"
              value={input || ''}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Pregunta algo..."
              className={`flex-1 bg-transparent border-none text-sm focus:outline-none focus:ring-0 placeholder:text-slate-400 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className={`p-1.5 rounded-xl transition-all flex-shrink-0 ${
                input.trim() && !isTyping
                  ? 'bg-brand-600 text-white hover:bg-brand-500 shadow-md shadow-brand-500/20'
                  : isDarkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-400'
              }`}
            >
              {isTyping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
