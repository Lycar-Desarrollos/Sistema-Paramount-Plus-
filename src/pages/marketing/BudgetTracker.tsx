import React from 'react';
import { 
  DollarSign, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Filter, 
  Download,
  MoreVertical,
  AlertTriangle
} from 'lucide-react';
import { useCampaignStore } from '../../store/useCampaignStore';
import { useCampaigns } from '../../hooks/marketing/useCampaigns';
import { useMarketingKPIs } from '../../hooks/marketing/useMarketingKPIs';
import { motion } from 'framer-motion';

export default function BudgetTracker({ isDarkMode = true }: { isDarkMode?: boolean }) {
  const activeProjectId = useCampaignStore(state => state.activeProjectId);
  const { campaigns, loading } = useCampaigns(activeProjectId);
  const kpis = useMarketingKPIs(campaigns);

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Cargando Presupuestos...</div>;

  return (
    <div className="p-8 space-y-8 max-w-[1400px] mx-auto overflow-y-auto h-full">
      <div className="flex justify-between items-end">
        <div>
           <h2 className={`text-2xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Presupuesto de Marketing</h2>
           <p className="text-sm text-slate-500 font-medium">Control financiero y proyección de gasto.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all">
           <Download className="w-3.5 h-3.5" /> Exportar CSV
        </button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-brand-500/10 border-brand-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'bg-brand-50 border-brand-200'}`}>
            <div className="flex justify-between items-center mb-4">
               <div className="p-2 rounded-lg bg-brand-500 text-white"><DollarSign size={20} /></div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-brand-400">Total Presupuestado</span>
            </div>
            <h3 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-brand-900'}`}>${kpis.totalBudget.toLocaleString()}</h3>
         </div>

         <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-pink-500/10 border-pink-500/20 shadow-[0_0_20px_rgba(236,72,153,0.1)]' : 'bg-pink-50 border-pink-200'}`}>
            <div className="flex justify-between items-center mb-4">
               <div className="p-2 rounded-lg bg-pink-500 text-white"><ArrowUpCircle size={20} /></div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-pink-400">Gasto Total Real</span>
            </div>
            <h3 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-pink-900'}`}>${kpis.totalSpent.toLocaleString()}</h3>
         </div>

         <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
            <div className="flex justify-between items-center mb-4">
               <div className="p-2 rounded-lg bg-emerald-500 text-white"><ArrowDownCircle size={20} /></div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Balance Disponible</span>
            </div>
            <h3 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-emerald-900'}`}>${(kpis.totalBudget - kpis.totalSpent).toLocaleString()}</h3>
         </div>
      </div>

      {/* Budget List */}
      <div className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-[#13131a]/50 border-white/5' : 'bg-white border-slate-200 shadow-xl'}`}>
         <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Desglose por Campaña</h3>
            <button className="text-slate-500 hover:text-white transition-colors"><Filter size={16} /></button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500 bg-white/[0.02]' : 'text-slate-400 bg-slate-50'}`}>
                  <tr>
                     <th className="px-6 py-4">Campaña</th>
                     <th className="px-6 py-4">Presupuesto</th>
                     <th className="px-6 py-4">Gasto Actual</th>
                     <th className="px-6 py-4">Progreso</th>
                     <th className="px-6 py-4 text-right">Estado</th>
                  </tr>
               </thead>
               <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                  {campaigns.map(camp => {
                     const progress = (camp.spent / camp.budget) * 100;
                     const isOverBudget = progress > 100;
                     return (
                        <tr key={camp.id} className="hover:bg-white/[0.01] transition-colors">
                           <td className="px-6 py-4">
                              <span className={`font-bold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{camp.name}</span>
                           </td>
                           <td className={`px-6 py-4 text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>${camp.budget?.toLocaleString()}</td>
                           <td className={`px-6 py-4 text-sm font-bold ${isOverBudget ? 'text-rose-500' : (isDarkMode ? 'text-white' : 'text-slate-900')}`}>
                              ${camp.spent?.toLocaleString()}
                              {isOverBudget && <AlertTriangle size={12} className="inline ml-1" />}
                           </td>
                           <td className="px-6 py-4 w-[200px]">
                              <div className="flex items-center gap-3">
                                 <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                    <motion.div 
                                       initial={{ width: 0 }}
                                       animate={{ width: `${Math.min(progress, 100)}%` }}
                                       className={`h-full rounded-full ${isOverBudget ? 'bg-rose-500' : (progress > 80 ? 'bg-amber-500' : 'bg-brand-500')}`}
                                    ></motion.div>
                                 </div>
                                 <span className="text-[10px] font-bold text-slate-500">{Math.round(progress)}%</span>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button className="p-1.5 rounded-lg hover:bg-white/5 text-slate-600 hover:text-white transition-colors">
                                 <MoreVertical size={16} />
                              </button>
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
