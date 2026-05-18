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
  Plus,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCampaignStore } from '../store/useCampaignStore';
import { cn, hashColor, AVATAR_COLORS } from '../lib/utils';

export default function Dashboard({ 
  onCreateProject, 
  onCreateTable, 
  userData,
  onOpenProject,
  onOpenTable,
  onNavigateTab
}: { 
  onCreateProject: () => void, 
  onCreateTable: (projectId: string) => void, 
  userData?: any,
  onOpenProject: (projectId: string) => void,
  onOpenTable: (projectId: string, tableId: string) => void,
  onNavigateTab: (tab: string) => void
}) {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const { projects, tables, allUsers, setActiveProjectId } = useCampaignStore();

  const role = userData?.role || 'colaborador';
  const isAdmin = role === 'admin';
  const isProveedor = role === 'proveedor';

  const stats = [];
  
  if (!isProveedor) {
    stats.push({ 
      id: 'espacios',
      label: 'Espacios', 
      value: projects.length, 
      icon: Layers, 
      color: 'text-violet-500', 
      bg: 'bg-violet-500/10',
      trend: projects.length > 0 ? 'Gestión activa' : 'Comienza ahora',
      action: () => onNavigateTab('Recientes')
    });
  }

  stats.push({ 
    id: 'tablas',
    label: isProveedor ? 'Mis Tablas' : 'Tablas', 
    value: tables.length, 
    icon: Database, 
    color: 'text-blue-500', 
    bg: 'bg-blue-500/10',
    trend: `${tables.length} Asignadas`,
    action: () => onNavigateTab('Recientes')
  });

  if (isAdmin) {
    stats.push({ 
      id: 'miembros',
      label: 'Miembros', 
      value: allUsers.length || 1, 
      icon: Users, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10',
      trend: 'Equipo verificado',
      action: () => onNavigateTab('Equipo')
    });
  }

  stats.push({ 
    id: 'favoritos',
    label: 'Favoritos', 
    value: projects.filter(p => p.favoriteBy?.includes(user?.email?.toLowerCase() ?? '')).length, 
    icon: Star, 
    color: 'text-amber-500', 
    bg: 'bg-amber-500/10',
    trend: 'Tus destacados',
    action: () => onNavigateTab('Favoritos')
  });

  const recentProjects = [...projects]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 4);

  const globalTables = [...tables]
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <h1 className={cn(
            "text-4xl font-black tracking-tight",
            isDarkMode ? "text-white" : "text-slate-900"
          )}>
            Bienvenido a <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-pink-500 drop-shadow-sm">NaticBox</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium max-w-xl">Gestiona tus datos, procesos y equipo desde un solo lugar. Todo lo que necesitas al alcance de un clic.</p>
        </div>
        
        {!isProveedor && (
          <button onClick={onCreateProject} className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-2xl transition-all shadow-xl shadow-brand-600/20 active:scale-95">
            <Plus className="w-5 h-5" />
            Nuevo Espacio
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className={`grid gap-6 ${stats.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : stats.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}
      >
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.id}
            variants={item}
            onClick={stat.action}
            className={cn(
              "p-6 rounded-[28px] border transition-all duration-300 group hover:scale-[1.02] backdrop-blur-sm cursor-pointer",
              isDarkMode ? "bg-white/[0.02] border-white/5 hover:border-white/10" : "bg-white border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:border-brand-500/20"
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Recent Activity */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className={cn("text-xl font-black tracking-tight flex items-center gap-3", isDarkMode ? "text-white" : "text-slate-900")}>
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-brand-500" />
              </div>
              {isProveedor ? 'Espacios Asignados' : 'Actividad Reciente'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentProjects.length > 0 ? (
              recentProjects.map(proj => (
                <button
                  key={proj.id}
                  onClick={() => onOpenProject(proj.id)}
                  className={cn(
                    "flex items-center gap-4 p-5 rounded-[24px] border text-left transition-all group relative overflow-hidden backdrop-blur-sm",
                    isDarkMode ? "bg-white/[0.02] border-white/5 hover:border-brand-500/30 hover:bg-brand-500/5" : "bg-white border-slate-200 hover:border-brand-500 shadow-sm"
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
                  <ArrowUpRight className="absolute top-4 right-4 w-4 h-4 text-slate-700 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
                </button>
              ))
            ) : (
              <div className={cn(
                "col-span-2 p-16 rounded-[32px] border border-dashed text-center",
                isDarkMode ? "border-white/10 bg-white/[0.02]" : "border-slate-200 bg-slate-50"
              )}>
                <Layers className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                <p className="text-slate-500 font-bold text-sm">
                  {isProveedor ? 'No tienes espacios asignados aún.' : 'Aún no tienes espacios de trabajo activos.'}
                </p>
                {!isProveedor && (
                  <button 
                    onClick={onCreateProject}
                    className="mt-4 text-xs font-black text-brand-500 hover:underline uppercase tracking-widest"
                  >
                    Crear mi primer espacio
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Decorative Spacer Widget to balance layout */}
          <div className={cn(
            "p-8 rounded-[32px] border relative overflow-hidden flex-1 flex flex-col justify-center min-h-[280px]",
            isDarkMode ? "bg-white/[0.02] border-white/5 backdrop-blur-sm" : "bg-gradient-to-br from-slate-50 to-white border-slate-200 shadow-sm"
          )}>
            <div className="absolute -bottom-16 -right-16 opacity-5 pointer-events-none transition-transform group-hover:scale-110">
              <Sparkles className="w-80 h-80 text-brand-500" />
            </div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-500/10 text-brand-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                NaticBox Insights
              </div>
              <h3 className={cn("text-xl sm:text-2xl font-black mb-3 tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>
                Optimiza tu flujo de trabajo
              </h3>
              <p className="text-slate-500 font-medium text-sm max-w-md leading-relaxed mb-8">
                {isProveedor 
                  ? "Mantén tus tareas al día revisando las tablas a las que has sido asignado. Toda la información que necesitas está a un clic de distancia." 
                  : "Los espacios de trabajo son ideales para separar distintos proyectos, departamentos o clientes. Personaliza tus tablas con columnas de estado, fechas límite y asignaciones de equipo para mantener todo organizado."}
              </p>
              
              {!isProveedor && (
                <button 
                  onClick={onCreateProject}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black transition-all w-max uppercase tracking-widest",
                    isDarkMode ? "bg-white/5 hover:bg-white/10 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                  )}
                >
                  <Plus className="w-4 h-4" />
                  NUEVO ESPACIO
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Global Access */}
        <div className="space-y-6">
          <h2 className={cn("text-xl font-black tracking-tight flex items-center gap-3", isDarkMode ? "text-white" : "text-slate-900")}>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            {isProveedor ? 'Tus Tablas' : 'Acceso Rápido'}
          </h2>

          <div className="space-y-3">
            {globalTables.length > 0 ? (
              globalTables.map(table => (
                <div 
                  key={table.id}
                  onClick={() => onOpenTable(table.projectId, table.id)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border group cursor-pointer transition-all backdrop-blur-sm",
                    isDarkMode ? "bg-white/[0.02] border-white/5 hover:border-brand-500/30 hover:bg-brand-500/5" : "bg-white border-slate-100 shadow-sm hover:border-slate-300 hover:shadow-md"
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
              <div className="text-center py-10 border border-dashed border-white/5 rounded-2xl">
                <Database className="w-8 h-8 text-slate-800 mx-auto mb-2 opacity-20" />
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">No hay tablas creadas</p>
              </div>
            )}

            {!isProveedor && (
              <button 
                onClick={() => projects.length > 0 ? onCreateTable(projects[0].id) : onCreateProject()}
                className={cn(
                  "w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-dashed font-black text-xs transition-all uppercase tracking-widest",
                  isDarkMode ? "border-white/10 text-slate-500 hover:border-brand-500/50 hover:text-brand-400" : "border-slate-200 text-slate-400 hover:border-brand-500 hover:text-brand-500"
                )}
              >
                <Plus className="w-4 h-4" />
                NUEVA TABLA
              </button>
            )}
          </div>

          {/* Platform Status - REAL INDICATORS (Only Admin/Colaborador) */}
          {!isProveedor && (
            <div className={cn(
              "p-6 rounded-[28px] border",
              isDarkMode ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200"
            )}>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                <h4 className={cn("text-[10px] font-black uppercase tracking-[0.2em]", isDarkMode ? "text-slate-500" : "text-slate-400")}>
                  Estado de la plataforma
                </h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">Base de datos</span>
                  <span className="text-[11px] font-black text-emerald-500 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Sincronizada
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">Cloudinary API</span>
                  <span className="text-[11px] font-black text-emerald-500 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Conectada
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">Plan actual</span>
                  <span className="text-[11px] font-black text-brand-500 px-2 py-0.5 rounded bg-brand-500/10">
                    Business PRO
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
