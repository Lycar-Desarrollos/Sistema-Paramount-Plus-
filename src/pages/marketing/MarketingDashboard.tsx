import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Target, 
  BarChart3, 
  PieChart, 
  Plus, 
  Calendar,
  ArrowUpRight,
  Zap,
  Search
} from 'lucide-react';
import { KPICard } from '../../components/marketing/KPICard';
import { useCampaigns } from '../../hooks/marketing/useCampaigns';
import { useMarketingKPIs } from '../../hooks/marketing/useMarketingKPIs';
import { useCampaignStore } from '../../store/useCampaignStore';
import type { Campaign } from '../../types/marketing';
import { motion } from 'framer-motion';

export default function MarketingDashboard({ isDarkMode = true }: { isDarkMode?: boolean }) {
  const activeProjectId = useCampaignStore(state => state.activeProjectId);
  const { campaigns, loading } = useCampaigns(activeProjectId);
  const kpis = useMarketingKPIs(campaigns);

  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className={`h-10 w-64 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className={`h-32 rounded-[24px] ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-200/50'}`}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Marketing Hub
          </h1>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Métricas de rendimiento y control de campañas en tiempo real.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
             <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`} />
             <input 
                type="text" 
                placeholder="Filtrar contenido..." 
                className={`border rounded-lg pl-9 pr-4 py-1.5 text-xs outline-none focus:border-brand-500 transition-all ${
                   isDarkMode ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`} 
             />
          </div>
          <button className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            isDarkMode ? 'bg-white/5 text-white hover:bg-white/10 border border-white/10' : 'bg-white text-slate-900 border border-slate-200'
          }`}>
            <Calendar className="w-4 h-4" /> Exportar Reporte
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/25">
            <Plus className="w-4 h-4" /> Nueva Campaña
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <KPICard 
          title="Campañas Activas" 
          value={kpis.activeCount} 
          icon={Target} 
          color="bg-brand-500" 
          trend={{ value: 12, isPositive: true }}
          isDarkMode={isDarkMode}
        />
        <KPICard 
          title="Presupuesto Total" 
          value={`$${(kpis.totalBudget / 1000).toFixed(1)}k`} 
          icon={PieChart} 
          color="bg-purple-500" 
          isDarkMode={isDarkMode}
        />
        <KPICard 
          title="Gasto Real" 
          value={`$${(kpis.totalSpent / 1000).toFixed(1)}k`} 
          icon={TrendingUp} 
          color="bg-pink-500" 
          trend={{ value: 5, isPositive: false }}
          isDarkMode={isDarkMode}
        />
        <KPICard 
          title="Leads Generados" 
          value="1,284" 
          icon={Users} 
          color="bg-emerald-500" 
          trend={{ value: 24, isPositive: true }}
          isDarkMode={isDarkMode}
        />
        <KPICard 
          title="ROI Promedio" 
          value={`${kpis.avgROI.toFixed(1)}%`} 
          icon={ArrowUpRight} 
          color="bg-amber-500" 
          isDarkMode={isDarkMode}
        />
        <KPICard 
          title="Tareas" 
          value="42" 
          icon={Zap} 
          color="bg-sky-500" 
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Charts & Activity Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        <div className={`lg:col-span-2 p-8 card-standard ${
          isDarkMode ? 'card-dark' : 'card-light'
        }`}>
          <div className="flex justify-between items-center mb-8">
            <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Rendimiento de Inversión</h3>
            <div className={`p-1 rounded-xl flex ${isDarkMode ? 'bg-black/20' : 'bg-slate-100'}`}>
               <button className="px-4 py-1.5 text-xs font-bold bg-brand-600 text-white rounded-lg shadow-md shadow-brand-600/20 transition-all">Mes</button>
               <button className={`px-4 py-1.5 text-xs font-bold transition-all ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>Año</button>
            </div>
          </div>
          <div className={`h-[350px] flex items-center justify-center border-2 border-dashed rounded-2xl ${isDarkMode ? 'border-white/5 bg-white/[0.01]' : 'border-slate-100 bg-slate-50/50'}`}>
             <div className="flex flex-col items-center gap-4">
               <div className={`p-4 rounded-full ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                 <BarChart3 className={`w-10 h-10 ${isDarkMode ? 'text-brand-500' : 'text-brand-400'}`} />
               </div>
               <p className={`${isDarkMode ? 'text-slate-500' : 'text-slate-400'} font-bold text-sm tracking-tight`}>Motor de Gráficos Recharts en construcción...</p>
             </div>
          </div>
        </div>

        <div className={`p-8 card-standard ${
          isDarkMode ? 'card-dark' : 'card-light'
        }`}>
          <h3 className={`text-xl font-black mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Actividad Reciente</h3>
          <div className="space-y-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex gap-4 items-start group">
                <div className="w-2.5 h-2.5 mt-1.5 rounded-full bg-brand-500 shadow-[0_0_15px_rgba(139,92,246,0.6)] group-hover:scale-125 transition-transform"></div>
                <div>
                  <p className={`text-sm font-bold leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    Nueva pieza de contenido aprobada para <span className="text-brand-500">Summer Sale</span>
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wider">Hace 15 minutos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
