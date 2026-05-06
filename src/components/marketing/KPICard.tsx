import React from 'react';
import { motion } from 'framer-motion';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: any; // Cambiado de LucideIcon a any para compatibilidad
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: string;
  isDarkMode?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({ 
  title, value, icon: Icon, trend, color, isDarkMode = true 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-[24px] border transition-all duration-300 group hover:scale-[1.02] ${
        isDarkMode 
          ? 'bg-[#13131a]/80 border-white/5 backdrop-blur-xl shadow-2xl' 
          : 'bg-white border-slate-200 shadow-lg'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${color} bg-opacity-10 transition-colors group-hover:bg-opacity-20`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
            trend.isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
          }`}>
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
          </div>
        )}
      </div>
      
      <div>
        <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {title}
        </p>
        <h3 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          {value}
        </h3>
      </div>

      {/* Ambient Sparkle Effect */}
      <div className={`absolute top-0 right-0 w-24 h-24 blur-[50px] -z-10 rounded-full opacity-20 ${color}`}></div>
    </motion.div>
  );
};
