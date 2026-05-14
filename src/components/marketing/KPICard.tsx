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
      className={`p-6 card-standard relative overflow-hidden ${
        isDarkMode ? 'card-dark' : 'card-light'
      }`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl ${color} bg-opacity-10 transition-transform group-hover:scale-110 shadow-sm`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
            trend.isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
          }`}>
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
          </div>
        )}
      </div>
      
      <div>
        <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          {title}
        </p>
        <h3 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          {value}
        </h3>
      </div>

      {/* Ambient Glow */}
      <div className={`absolute -bottom-8 -right-8 w-24 h-24 blur-[60px] rounded-full opacity-20 transition-opacity group-hover:opacity-30 ${color}`}></div>
    </motion.div>
  );
};
