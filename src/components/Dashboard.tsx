import React from 'react';
import { motion } from 'framer-motion';
import { 
  Layout, 
  Sparkles, 
  Database, 
  Users, 
  Clock, 
  ArrowUpRight, 
  TrendingUp, 
  Layers, 
  Star,
  Plus
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useCampaignStore } from '../store/useCampaignStore';
import { cn, hashColor, AVATAR_COLORS } from '../lib/utils';

export default function Dashboard() {
  const { isDarkMode } = useTheme();
  const { projects, tables, allUsers, activeProjectId, setActiveProjectId } = useCampaignStore();

  const stats = [
    { 
      label: 'Espacios', 
      value: projects.length, 
      icon: Layers, 
      color: 'text-violet-500', 
      bg: 'bg-violet-500/10',
      trend: '+2 esta semana'
    },
    { 
      label: 'Tablas', 
      value: tables.length, 
      icon: Database, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10',
      trend: 'Activas'
    },
    { 
      label: 'Miembros', 
      value: allUsers.length, 
      icon: Users, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10',
      trend: 'Equipo verificado'
    },
    { 
      label: 'Favoritos', 
      value: projects.filter(p => p.favoriteBy?.length).length, 
      icon: Star, 
      color: 'text-amber-500', 
      bg: 'bg-amber-500/10',
      trend: 'Destacados'
    }
  ];

  const recentProjects = [...projects]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 4);

  const recentTables = [...tables]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 5);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className={cn(
            "text-4xl font-black tracking-tight",
            isDarkMode ? "text-white" : "text-slate-900"
          )}>
            Bienvenido a <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-pink-500">NaticBox</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Gestiona tus datos, procesos y equipo desde un solo lugar.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={cn(
            "px-4 py-2 rounded-2xl flex items-center gap-2 border",
            isDarkMode ? "bg-white/5 border-white/10 text-slate-400" : "bg-white border-slate-200 text-slate-600 shadow-sm"
          )}>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest">Sistema Activo</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            variants={item}
            className={cn(
              "p-6 rounded-[28px] border transition-all duration-300 group hover:scale-[1.02]",
              isDarkMode ? "bg-[#13131a] border-white/5 hover:border-white/10" : "bg-white border-slate-100 shadow-xl shadow-slate-200/40"
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <div className={cn(
                "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                isDarkMode ? "bg-white/5 text-slate-500" : "bg-slate-50 text-slate-400"
              )}>
                {stat.trend}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <div className="flex items-end gap-2">
                <p className={cn("text-3xl font-black", isDarkMode ? "text-white" : "text-slate-900")}>
                  {stat.value}
                </p>
                <ArrowUpRight className="w-4 h-4 text-emerald-500 mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Work */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className={cn("text-xl font-black tracking-tight flex items-center gap-2", isDarkMode ? "text-white" : "text-slate-900")}>
              <Clock className="w-5 h-5 text-brand-500" />
              Actividad Reciente
            </h2>
            <button className="text-xs font-bold text-brand-500 hover:underline">Ver todo</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentProjects.length > 0 ? (
              recentProjects.map(proj => (
                <button
                  key={proj.id}
                  onClick={() => setActiveProjectId(proj.id)}
                  className={cn(
                    "flex items-center gap-4 p-5 rounded-[24px] border text-left transition-all group",
                    isDarkMode ? "bg-[#13131a] border-white/5 hover:border-brand-500/30 hover:bg-brand-500/5" : "bg-white border-slate-200 hover:border-brand-500 shadow-sm"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black text-white shadow-lg shrink-0",
                    hashColor(proj.id, AVATAR_COLORS)
                  )}>
                    {proj.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className={cn("text-sm font-bold truncate group-hover:text-brand-500 transition-colors", isDarkMode ? "text-white" : "text-slate-900")}>
                      {proj.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-widest">
                      {proj.memberEmails?.length || 1} Miembros · Espacio
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className={cn(
                "col-span-2 p-12 rounded-[32px] border border-dashed text-center",
                isDarkMode ? "border-white/10 bg-white/[0.02]" : "border-slate-200 bg-slate-50"
              )}>
                <p className="text-slate-500 font-medium">Aún no tienes espacios de trabajo.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tables & Resources */}
        <div className="space-y-6">
          <h2 className={cn("text-xl font-black tracking-tight flex items-center gap-2", isDarkMode ? "text-white" : "text-slate-900")}>
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Tablas Globales
          </h2>

          <div className="space-y-3">
            {recentTables.length > 0 ? (
              recentTables.map(table => (
                <div 
                  key={table.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border group cursor-pointer transition-all",
                    isDarkMode ? "bg-[#13131a] border-white/5 hover:border-white/20" : "bg-white border-slate-100 shadow-sm hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Database className="w-5 h-5 text-brand-500" />
                    </div>
                    <div className="min-w-0">
                      <p className={cn("text-xs font-bold truncate", isDarkMode ? "text-white" : "text-slate-900")}>
                        {table.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate uppercase tracking-widest">
                        {table.columnDefinitions?.length || 0} Columnas
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-brand-500 transition-colors" />
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-xs text-slate-500 font-medium">No hay tablas globales.</p>
              </div>
            )}

            <button className={cn(
              "w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-dashed font-black text-xs transition-all uppercase tracking-widest",
              isDarkMode ? "border-white/10 text-slate-500 hover:border-brand-500/50 hover:text-brand-400" : "border-slate-200 text-slate-400 hover:border-brand-500 hover:text-brand-500"
            )}>
              <Plus className="w-4 h-4" />
              Crear Nueva Tabla
            </button>
          </div>

          {/* System Info */}
          <div className={cn(
            "p-6 rounded-[28px] border",
            isDarkMode ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200"
          )}>
            <h4 className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-4", isDarkMode ? "text-slate-500" : "text-slate-400")}>
              Estado de la plataforma
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Base de datos</span>
                <span className="text-[11px] font-black text-emerald-500">Sincronizada</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Cloudinary API</span>
                <span className="text-[11px] font-black text-emerald-500">Conectada</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Plan actual</span>
                <span className="text-[11px] font-black text-brand-500">Business PRO</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
