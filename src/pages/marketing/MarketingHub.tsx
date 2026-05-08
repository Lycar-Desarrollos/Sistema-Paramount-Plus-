import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  BarChart3, 
  Users, 
  Zap,
  ChevronRight,
  Settings
} from 'lucide-react';
import MarketingDashboard from './MarketingDashboard';
import ContentPipeline from './ContentPipeline';
import BudgetTracker from './BudgetTracker';
import LeadPipeline from './LeadPipeline';
import CampaignHub from './CampaignHub';
import { useTheme } from '../../context/ThemeContext';

type MarketingTab = 'overview' | 'content' | 'budget' | 'leads' | 'hub';

export default function MarketingHub() {
  const { isDarkMode } = useTheme();
  const [activeSubTab, setActiveSubTab] = useState<MarketingTab>('overview');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'content', label: 'Contenido', icon: Layers },
    { id: 'budget', label: 'Presupuesto', icon: BarChart3 },
    { id: 'leads', label: 'Leads (CRM)', icon: Users }
  ];

  const handleOpenCampaign = (id: string) => {
    setSelectedCampaignId(id);
    setActiveSubTab('hub');
  };

  return (
    <div className="flex h-full overflow-hidden bg-transparent">
      {/* Sidebar de Navegación del Módulo (Minimalista) */}
      <aside className={`w-64 flex flex-col border-r transition-all duration-300 ${
        isDarkMode ? 'bg-[#0a0a0f]/40 border-white/5' : 'bg-white border-slate-200'
      }`}>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
            <span className={`text-xs font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Módulo Marketing
            </span>
          </div>
          
          <nav className="space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id as MarketingTab)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeSubTab === item.id
                    ? (isDarkMode ? 'bg-brand-500/10 text-brand-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-brand-50 text-brand-600')
                    : (isDarkMode ? 'text-slate-500 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100')
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
                {activeSubTab === item.id && <ChevronRight className="w-3 h-3" />}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
           <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                 <Zap className="w-3 h-3 text-brand-400" />
                 <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Pro Automations</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">Slack y Notificaciones de Budget activas.</p>
           </div>
           
           <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:text-white transition-all`}>
              <Settings className="w-4 h-4" /> Configuración
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <div className="h-full w-full">
          {activeSubTab === 'overview' && <MarketingDashboard isDarkMode={isDarkMode} />}
          {activeSubTab === 'content' && <ContentPipeline isDarkMode={isDarkMode} />}
          {activeSubTab === 'budget' && <BudgetTracker isDarkMode={isDarkMode} />}
          {activeSubTab === 'leads' && <LeadPipeline isDarkMode={isDarkMode} />}
          {activeSubTab === 'hub' && <CampaignHub isDarkMode={isDarkMode} onBack={() => setActiveSubTab('overview')} />}
        </div>
      </main>
    </div>
  );
}
