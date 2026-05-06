import React from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  Mail,
  Phone,
  TrendingUp,
  Star
} from 'lucide-react';
import { useCampaignStore } from '../../store/useCampaignStore';
import { motion } from 'framer-motion';

const LEAD_COLUMNS = [
  { id: 'Nuevo', title: 'Nuevos Leads', color: 'bg-brand-500' },
  { id: 'Contactado', title: 'En Contacto', color: 'bg-blue-500' },
  { id: 'Calificado', title: 'Calificados', color: 'bg-purple-500' },
  { id: 'Propuesta', title: 'Propuesta Enviada', color: 'bg-amber-500' },
  { id: 'Negociación', title: 'Negociación', color: 'bg-pink-500' },
  { id: 'Ganado', title: 'Ganado', color: 'bg-emerald-500' }
];

export default function LeadPipeline({ isDarkMode = true }: { isDarkMode?: boolean }) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className={`px-8 py-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${isDarkMode ? 'bg-[#0a0a0f]/50 border-white/5' : 'bg-white border-slate-200'}`}>
         <div>
            <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Pipeline de Leads (CRM)</h2>
            <p className="text-sm text-slate-500 font-medium">Gestión y seguimiento de conversiones de campañas.</p>
         </div>
         <div className="flex items-center gap-3">
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
               <input type="text" placeholder="Buscar lead..." className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-brand-500 transition-all" />
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/25">
               <Plus className="w-4 h-4" /> Nuevo Lead
            </button>
         </div>
      </div>

      {/* Kanban Lead Grid */}
      <div className="flex-1 overflow-x-auto p-8">
         <div className="flex gap-6 h-full items-start min-w-max">
            {LEAD_COLUMNS.map(col => (
               <div key={col.id} className="w-[300px] flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4 px-2">
                     <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${col.color}`}></div>
                        <h3 className={`font-extrabold text-[13px] uppercase tracking-wider ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{col.title}</h3>
                     </div>
                     <MoreHorizontal className="w-4 h-4 text-slate-600" />
                  </div>

                  <div className={`flex-1 rounded-2xl p-2 space-y-4 overflow-y-auto ${isDarkMode ? 'bg-white/[0.01]' : 'bg-slate-100'}`}>
                     {/* Mock Lead Card */}
                     <div className={`p-4 rounded-xl border transition-all ${isDarkMode ? 'bg-[#1a1a24] border-white/5 hover:border-brand-500/30' : 'bg-white border-slate-200'}`}>
                        <div className="flex justify-between items-start mb-3">
                           <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-500 border border-brand-500/20">Google Ads</span>
                           <div className="flex text-amber-500"><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /></div>
                        </div>
                        <h4 className={`font-bold text-[15px] mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Juan Pérez</h4>
                        <p className="text-xs text-slate-500 font-medium mb-4">TechSolutions Inc.</p>
                        
                        <div className="flex items-center gap-3 pt-3 border-t border-white/5 text-slate-500">
                           <Mail size={14} className="hover:text-white cursor-pointer transition-colors" />
                           <Phone size={14} className="hover:text-white cursor-pointer transition-colors" />
                           <div className="ml-auto flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                              <TrendingUp size={12} /> $4,500
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
