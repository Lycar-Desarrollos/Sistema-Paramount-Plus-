import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Plus, 
  Clock, 
  Layout, 
  Search, 
  ChevronRight, 
  X, 
  Send, 
  Calendar, 
  FileText, 
  AlertCircle,
  Database
} from 'lucide-react';
import { useCampaignStore, type Project, type Table, MARKETING_REQUEST_COLUMNS } from '../store/useCampaignStore';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserMenu } from './UserMenu';

export default function ClientPortal() {
  const { user, userData } = useAuth();
  const { isDarkMode } = useTheme();
  const { 
    projects, tables, records, 
    setActiveProjectId,
    initializeProjectData, initializeTableData,
    addRecord, addTable
  } = useCampaignStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeClientTableId, setActiveClientTableId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Record<string, any>>({
    title: '',
    status: 'Nueva',
    type: 'Video',
    cantidad: 1,
    channel: '',
    delivery: '',
    dimensions: '',
    duration: 0,
    file_form: '',
    month: new Date().toLocaleString('es-ES', { month: 'long' }),
    notes: ''
  });

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
      setActiveProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId, setActiveProjectId]);

  const activeProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);

  const allowedTables = useMemo(() => {
    if (!activeProject || !user?.email) return [];
    const emailKey = user.email.toLowerCase().replace(/\./g, '_');
    const allowedIds = activeProject.clientPermissions?.[emailKey] || [];
    return tables.filter(t => t.projectId === selectedProjectId && allowedIds.includes(t.id));
  }, [activeProject, tables, user?.email, selectedProjectId]);

  useEffect(() => {
    if (allowedTables.length > 0 && !activeClientTableId) {
      setActiveClientTableId(allowedTables[0].id);
    }
  }, [allowedTables, activeClientTableId]);

  useEffect(() => {
    if (!selectedProjectId) return;
    const unsub = initializeProjectData(selectedProjectId);
    return () => unsub();
  }, [selectedProjectId, initializeProjectData]);

  const requestsTable = useMemo(() => {
    return allowedTables.find(t => t.id === activeClientTableId);
  }, [allowedTables, activeClientTableId]);

  useEffect(() => {
    if (requestsTable) {
      const unsub = initializeTableData(requestsTable.id);
      return () => unsub();
    }
  }, [requestsTable, initializeTableData]);

  const clientRequests = useMemo(() => {
    return records.filter(r => r.tableId === requestsTable?.id && r.createdBy === user?.email?.toLowerCase());
  }, [records, requestsTable, user]);

  const filteredRequests = clientRequests.filter(r => 
    r.values.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestsTable) return;
    
    await addRecord(requestsTable.id, formData);
    setIsFormOpen(false);
    setFormData({
      title: '', status: 'Nueva', type: 'Video', cantidad: 1, channel: '', delivery: '', dimensions: '', duration: 0, file_form: '',
      month: new Date().toLocaleString('es-ES', { month: 'long' }), notes: ''
    });
  };

  const getStatusColor = (status: string) => {
    const option = MARKETING_REQUEST_COLUMNS.find(c => c.id === 'status')?.config?.options?.find(o => o.label === status);
    return option?.color || '#94a3b8';
  };

  if (projects.length === 0 && !selectedProjectId) {
    return (
      <div className={`h-screen w-screen flex flex-col items-center justify-center ${isDarkMode ? 'bg-[#030305] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <Sparkles className="w-12 h-12 text-brand-500 animate-pulse mb-4" />
        <p className="text-sm font-bold tracking-widest uppercase opacity-50">Cargando Portal...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 ${isDarkMode ? 'bg-[#030305] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header Premium */}
      <header className={`h-20 flex-shrink-0 flex items-center justify-between px-10 border-b z-20 ${isDarkMode ? 'bg-[#0a0a0f]/80 backdrop-blur-xl border-white/5' : 'bg-white/80 backdrop-blur-xl border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className={`text-xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              NaticBox <span className="text-brand-500">Portal</span>
            </span>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Módulo de Clientes VIP</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {projects.length > 1 && (
            <select 
              value={selectedProjectId || ''} 
              onChange={e => {
                setSelectedProjectId(e.target.value);
                setActiveProjectId(e.target.value);
                setActiveClientTableId(null);
              }}
              className={`px-4 py-2 rounded-2xl border text-xs font-bold outline-none ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'}`}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          {activeProject && projects.length === 1 && (
            <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold">{activeProject.name}</span>
            </div>
          )}
          <UserMenu user={user} userData={userData} onManageTeam={() => {}} onManageAccount={() => {}} />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar for Tables */}
        {allowedTables.length > 0 && (
          <aside className={`w-72 flex-shrink-0 border-r flex flex-col p-6 gap-6 ${isDarkMode ? 'bg-[#0a0a0f]/50 border-white/5' : 'bg-white border-slate-100'}`}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Apartados Disponibles</p>
              <div className="space-y-1.5">
                {allowedTables.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveClientTableId(t.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-xs ${
                      activeClientTableId === t.id
                        ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                        : (isDarkMode ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                    }`}
                  >
                    <Layout className="w-4 h-4 opacity-70" />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

        <main className="flex-1 flex flex-col overflow-hidden p-10">
          <section className="mb-12 flex items-end justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2">
                Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-pink-500">{userData?.displayName || user?.email?.split('@')[0]}</span>
              </h1>
              <p className="text-slate-500 font-medium">
                {allowedTables.length === 0 
                  ? 'Tu portal se está configurando. Pronto verás tus proyectos aquí.' 
                  : 'Gestiona tus solicitudes de marketing y revisa el progreso en tiempo real.'}
              </p>
            </div>
            {requestsTable?.type === 'requests' && (
              <button 
                onClick={() => setIsFormOpen(true)}
                className="flex items-center gap-3 px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-[20px] font-black shadow-xl shadow-brand-600/20 transition-all active:scale-95 group"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                Nueva Solicitud
              </button>
            )}
          </section>

          {allowedTables.length === 0 ? (
            <div className={`flex-1 flex flex-col items-center justify-center p-12 text-center rounded-[40px] border ${isDarkMode ? 'bg-[#0a0a0f] border-white/5' : 'bg-white border-slate-100 shadow-xl'}`}>
               <Clock className="w-10 h-10 text-brand-500 animate-pulse mb-8" />
               <h2 className="text-2xl font-black mb-4">Esperando Acceso</h2>
               <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                 Tu administrador aún no ha habilitado apartados para este proyecto.
               </p>
            </div>
          ) : (
            <section className={`flex-1 flex flex-col rounded-[40px] border overflow-hidden ${isDarkMode ? 'bg-[#0a0a0f] border-white/5 shadow-2xl' : 'bg-white border-slate-100 shadow-2xl shadow-slate-200/50'}`}>
              <div className={`px-10 py-6 border-b flex items-center justify-between ${isDarkMode ? 'border-white/5 bg-white/[0.02]' : 'border-slate-50 bg-slate-50/50'}`}>
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-black tracking-tight">{requestsTable?.name}</h2>
                  <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                      className={`pl-11 pr-4 py-2 text-xs font-bold rounded-xl border outline-none transition-all w-64 ${isDarkMode ? 'bg-black/40 border-white/5 focus:border-brand-500/50 text-white' : 'bg-white border-slate-200 focus:border-brand-500'}`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {requestsTable?.type === 'requests' ? (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredRequests.map((request, i) => (
                      <motion.div 
                        key={request.id}
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className={`p-6 rounded-3xl border flex items-center justify-between transition-all hover:scale-[1.01] ${isDarkMode ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                      >
                        <div className="flex items-center gap-6 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center shrink-0">
                            <Layout className="w-5 h-5 text-brand-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-base font-black truncate">{request.values.title}</h3>
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider`} style={{ backgroundColor: `${getStatusColor(request.values.status)}20`, color: getStatusColor(request.values.status) }}>
                                {request.values.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              <span>{request.values.type}</span>
                              <span>{request.values.delivery || 'Pendiente'}</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-y-2">
                      <thead>
                        <tr>
                          {requestsTable?.columnDefinitions.map(col => (
                            <th key={col.id} className="text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                              {col.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {records.filter(r => r.tableId === requestsTable?.id).map((record, i) => (
                          <tr key={record.id} className={`${isDarkMode ? 'bg-white/5' : 'bg-slate-50'} hover:bg-brand-500/10 transition-colors`}>
                            {requestsTable?.columnDefinitions.map(col => (
                              <td key={col.id} className="px-4 py-4 text-xs font-bold first:rounded-l-2xl last:rounded-r-2xl">
                                {String(record.values[col.id] || '-')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFormOpen(false)} className="absolute inset-0 bg-[#030305]/80 backdrop-blur-2xl" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }} className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[40px] border flex flex-col ${isDarkMode ? 'bg-[#0a0a0f] border-white/10' : 'bg-white border-slate-200'}`}>
              <div className="p-10 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tight">Nueva Solicitud</h2>
                <button onClick={() => setIsFormOpen(false)} className="p-3 rounded-2xl hover:bg-white/10 transition-all"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-6">
                <input required type="text" placeholder="Título" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-white/5 outline-none font-bold text-sm" />
                <div className="grid grid-cols-2 gap-4">
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="px-6 py-4 rounded-2xl bg-black/40 border border-white/5 outline-none font-bold text-sm">
                    <option value="Video">Video</option>
                    <option value="Estatico">Estatico</option>
                  </select>
                  <input type="date" value={formData.delivery} onChange={e => setFormData({...formData, delivery: e.target.value})} className="px-6 py-4 rounded-2xl bg-black/40 border border-white/5 outline-none font-bold text-sm" />
                </div>
                <textarea rows={4} placeholder="Notas adicionales..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-white/5 outline-none font-bold text-sm resize-none" />
                <button type="submit" className="w-full py-5 bg-brand-600 hover:bg-brand-500 text-white rounded-[20px] font-black shadow-xl transition-all flex items-center justify-center gap-3">
                  <Send className="w-5 h-5" /> Enviar Solicitud
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
