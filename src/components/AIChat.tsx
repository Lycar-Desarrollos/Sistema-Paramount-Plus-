import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
}

interface AIChatProps {
  onClose: () => void;
  userData?: any;
}

export default function AIChat({ onClose, userData }: AIChatProps) {
  const { isDarkMode } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: '¡Hola! Soy tu asistente de NaticBox PRO IA. ¿En qué puedo ayudarte con tu espacio de trabajo hoy?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Use the real AI logic service
    import('../services/aiLogic').then(async ({ processAIMessage }) => {
      const response = await processAIMessage(input.trim());
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: response.text,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed bottom-6 right-6 z-[100] flex flex-col shadow-2xl rounded-2xl overflow-hidden border transition-all duration-300 ${
          isExpanded ? 'w-[400px] h-[600px] sm:w-[500px] sm:h-[700px]' : 'w-[320px] h-[450px] sm:w-[350px] sm:h-[500px]'
        } ${isDarkMode ? 'bg-[#13131a]/95 backdrop-blur-xl border-white/10' : 'bg-white/95 backdrop-blur-xl border-slate-200'}`}
      >
        {/* Header */}
        <div className={`p-4 flex items-center justify-between border-b ${isDarkMode ? 'border-white/10 bg-gradient-to-r from-brand-600/20 to-pink-600/20' : 'border-slate-100 bg-gradient-to-r from-brand-50 to-pink-50'}`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-pink-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#13131a] rounded-full"></span>
            </div>
            <div>
              <h3 className={`font-bold text-sm flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                NaticBox AI
                <Sparkles className="w-3 h-3 text-pink-500" />
              </h3>
              <p className="text-[10px] text-brand-500 font-semibold uppercase tracking-wider">Agente Activo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button 
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar ${isDarkMode ? 'bg-[#0f0f13]/50' : 'bg-slate-50/50'}`}>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                msg.sender === 'ai' 
                  ? 'bg-gradient-to-br from-brand-500 to-pink-500 shadow-md shadow-brand-500/20' 
                  : (isDarkMode ? 'bg-slate-800' : 'bg-slate-200')
              }`}>
                {msg.sender === 'ai' ? (
                  <Sparkles className="w-4 h-4 text-white" />
                ) : (
                  userData?.photoURL ? (
                    <img src={userData.photoURL} alt="User" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className={`w-4 h-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`} />
                  )
                )}
              </div>
              <div className={`max-w-[75%] rounded-2xl p-3 text-sm shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-brand-600 text-white rounded-tr-sm'
                  : isDarkMode 
                    ? 'bg-[#1a1a24] text-slate-200 border border-white/5 rounded-tl-sm' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
              }`}>
                {msg.text}
                <div className={`text-[9px] mt-1.5 opacity-60 text-right ${msg.sender === 'user' ? 'text-brand-100' : ''}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-brand-500 to-pink-500 shadow-md shadow-brand-500/20">
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className={`max-w-[75%] rounded-2xl p-4 text-sm shadow-sm rounded-tl-sm flex items-center gap-1 ${
                isDarkMode ? 'bg-[#1a1a24] border border-white/5' : 'bg-white border border-slate-100'
              }`}>
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`p-3 sm:p-4 border-t bg-transparent ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
          <div className={`flex items-center gap-2 rounded-xl border p-1 sm:p-1.5 pr-2 transition-colors ${
            isDarkMode ? 'bg-[#1a1a24] border-white/10 focus-within:border-brand-500/50' : 'bg-white border-slate-200 focus-within:border-brand-300'
          }`}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Pregúntale a la IA..."
              className="flex-1 bg-transparent border-none px-3 text-sm focus:outline-none focus:ring-0 placeholder:text-slate-500"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className={`p-2 rounded-lg transition-all ${
                input.trim() && !isTyping
                  ? 'bg-brand-600 text-white hover:bg-brand-500 shadow-md shadow-brand-500/20'
                  : isDarkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-400'
              }`}
            >
              {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <div className="text-center mt-2">
            <span className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              La IA puede cometer errores. Considera verificar la información.
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
