import React from 'react';
import { 
  ArrowLeft, 
  Target, 
  Settings, 
  Share2, 
  Clock, 
  Briefcase,
  LayoutGrid,
  FileText,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function CampaignHub({ isDarkMode = true, onBack }: { isDarkMode?: boolean, onBack?: () => void }) {
  return (
    <div className="p-8 space-y-8 max-w-[1400px] mx-auto overflow-y-auto h-full pb-20">
      {/* Detail Header */}
      <div className="flex justify-between items-start">
         <div className="flex items-center gap-6">
            <button 
              onClick={onBack}
              className={`p-3 rounded-2xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900'}`}
            >
               <ArrowLeft size={20} />
            </button>
            <div>
               <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-brand-500 text-white">Social Media</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Activa</span>
               </div>
               <h1 className={`text-4xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Summer Launch 2026</h1>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <button className={`p-2.5 rounded-xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500'}`}><Share2 size={18} /></button>
            <button className={`p-2.5 rounded-xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500'}`}><Settings size={18} /></button>
         </div>
      </div>

      {/* Grid Layout for Campaign Ecosistem */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Left Column: Metrics & Timeline */}
         <div className="lg:col-span-2 space-y-8">
            <div className={`p-8 rounded-[32px] border grid grid-cols-1 md:grid-cols-3 gap-8 ${isDarkMode ? 'bg-[#13131a]/50 border-white/5' : 'bg-white border-slate-200'}`}>
               <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Budget Utilizado</p>
                  <div className="flex items-end gap-2">
                     <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>74%</h3>
                     <span className="text-[10px] text-slate-500 mb-1">$45k / $60k</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
                     <div className="w-[74%] h-full bg-brand-500 rounded-full"></div>
                  </div>
               </div>
               <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Engagement</p>
                  <div className="flex items-end gap-2">
                     <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>8.2%</h3>
                     <span className="text-[10px] text-emerald-500 mb-1">+1.4% este mes</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
                     <div className="w-[82%] h-full bg-emerald-500 rounded-full"></div>
                  </div>
               </div>
               <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Leads</p>
                  <div className="flex items-end gap-2">
                     <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>482</h3>
                     <span className="text-[10px] text-slate-500 mb-1">Target: 600</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
                     <div className="w-[60%] h-full bg-purple-500 rounded-full"></div>
                  </div>
               </div>
            </div>

            {/* Campaign Ecosystem Tabs Placeholder */}
            <div className={`p-8 rounded-[32px] border ${isDarkMode ? 'bg-[#13131a]/50 border-white/5' : 'bg-white border-slate-200'}`}>
               <div className="flex items-center gap-8 border-b border-white/5 mb-8 overflow-x-auto pb-4">
                  {['Overview', 'Contenido', 'Assets', 'Tasks', 'Métricas'].map((tab, i) => (
                     <button key={tab} className={`text-sm font-bold whitespace-nowrap transition-all ${i === 0 ? 'text-brand-500 border-b-2 border-brand-500 pb-4' : 'text-slate-500 hover:text-white'}`}>
                        {tab}
                     </button>
                  ))}
               </div>
               <div className="h-[400px] flex items-center justify-center border-2 border-dashed border-white/5 rounded-3xl">
                  <p className="text-slate-600 font-medium">Contenido de la campaña en construcción...</p>
               </div>
            </div>
         </div>

         {/* Right Column: Info & Team */}
         <div className="space-y-8">
            <div className={`p-8 rounded-[32px] border ${isDarkMode ? 'bg-[#13131a]/50 border-white/5' : 'bg-white border-slate-200'}`}>
               <h3 className={`text-lg font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Información</h3>
               <div className="space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="p-2 rounded-xl bg-white/5 text-slate-400"><Clock size={16} /></div>
                     <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Timeline</p>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>15 Mayo - 20 Julio</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="p-2 rounded-xl bg-white/5 text-slate-400"><Target size={16} /></div>
                     <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Objetivo</p>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Brand Awareness</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="p-2 rounded-xl bg-white/5 text-slate-400"><Briefcase size={16} /></div>
                     <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Responsable</p>
                        <div className="flex items-center gap-2 mt-1">
                           <div className="w-6 h-6 rounded-full bg-brand-500"></div>
                           <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Daniela Reyes</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className={`p-8 rounded-[32px] border ${isDarkMode ? 'bg-[#13131a]/50 border-white/5' : 'bg-white border-slate-200'}`}>
               <h3 className={`text-lg font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Equipo del Proyecto</h3>
               <div className="space-y-4">
                  {[1,2,3].map(i => (
                     <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-white/10"></div>
                           <div>
                              <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Usuario {i}</p>
                              <p className="text-xs text-slate-500">Designer</p>
                           </div>
                        </div>
                        <span className="text-[10px] font-bold text-brand-400">Editor</span>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
