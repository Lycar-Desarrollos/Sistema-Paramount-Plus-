import React from 'react';
import { motion } from 'framer-motion';
import { Layout, Sparkles } from 'lucide-react';

interface DashboardProps {
  title?: string;
  icon?: React.ElementType;
  isDarkMode?: boolean;
}

export default function Dashboard({ title = "Interfaces", icon: Icon = Layout, isDarkMode = true }: DashboardProps) {
  return (
    <div className="h-full flex items-center justify-center min-h-[calc(100vh-14rem)]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`p-12 rounded-[32px] max-w-xl w-full text-center relative overflow-hidden group ${
          isDarkMode ? 'glass-card border border-white/5' : 'bg-white shadow-xl shadow-slate-200/50 border border-slate-100'
        }`}
      >
        {/* Glow Effects */}
        <div className={`absolute top-[-20%] right-[-10%] w-[80%] h-[80%] rounded-full blur-[100px] pointer-events-none mix-blend-screen ${isDarkMode ? 'bg-brand-500/20' : 'bg-brand-500/10 mix-blend-multiply'}`}></div>
        <div className={`absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[100px] pointer-events-none mix-blend-screen ${isDarkMode ? 'bg-pink-500/20' : 'bg-pink-500/10 mix-blend-multiply'}`}></div>
        
        <div className="relative z-10">
          <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center shadow-2xl mb-8 transform -rotate-6 group-hover:rotate-0 transition-all duration-500 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-[#1a1a24] to-[#0a0a0f] border border-white/10 shadow-brand-500/20' 
              : 'bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-brand-500/10'
          }`}>
            <Icon className="w-10 h-10 text-brand-500" />
          </div>
          
          <h2 className={`text-3xl font-bold tracking-tight mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {title} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-pink-500">En Desarrollo</span>
          </h2>
          
          <p className={`text-lg leading-relaxed mb-10 max-w-md mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Estamos construyendo un sistema completo para que puedas gestionar tus flujos de trabajo sin código.
          </p>

          <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium backdrop-blur-md ${
            isDarkMode 
              ? 'border border-white/10 bg-white/5 text-slate-300' 
              : 'border border-brand-100 bg-brand-50 text-brand-700'
          }`}>
            <Sparkles className="w-4 h-4 text-brand-500" />
            Próximamente disponible
          </div>
        </div>
      </motion.div>
    </div>
  );
}
