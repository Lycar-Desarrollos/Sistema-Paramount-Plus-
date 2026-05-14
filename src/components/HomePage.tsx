import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Grid3X3, List, Star, Clock, Users, LogOut, Sparkles, MoreHorizontal, Database, ArrowLeft, Table2, Trash2, Sun, Moon, ChevronRight, ChevronLeft, Info, X, Mail, Loader2 } from 'lucide-react';
import { cn, hashColor, AVATAR_COLORS } from '../lib/utils';
import { useCampaignStore, type Project, type Table } from '../store/useCampaignStore';
import type { UserRole } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserMenu } from './UserMenu';

interface HomePageProps {
  user: any;
  userData: any;
  projects: Project[];
  tables: Table[];
  onOpenProject: (projectId: string) => void;
  onOpenTable: (projectId: string, tableId: string) => void;
  onCreateProject: () => void;
  onCreateTable: (projectId: string) => void;
  onDeleteProject: (project: {id: string, name: string}) => void;
  onManageTeam: () => void;
  onManageAccount: () => void;
  onLogout: () => void;
  onToggleProMode: () => void;
  isProMode: boolean;
}

const TABLE_COLORS = [
  'bg-slate-700', 'bg-slate-600', 'bg-slate-800'
];

export default function HomePage({ 
  user, 
  userData, 
  projects, 
  tables,
  onOpenProject, 
  onOpenTable,
  onCreateProject,
  onCreateTable,
  onDeleteProject,
  onManageTeam,
  onManageAccount,
  onLogout,
  onToggleProMode,
  isProMode
}: HomePageProps) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    localStorage.getItem('natic_selected_project') || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [activeSidebarTab, setActiveSidebarTab] = useState<'Inicio'|'Favoritos'|'Recientes'|'Compartidos'|null>(
    selectedProjectId ? null : 'Inicio'
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [openMenuTableId, setOpenMenuTableId] = useState<string | null>(null);
  const [openMenuProjectId, setOpenMenuProjectId] = useState<string | null>(null);
  
  // double-click detection for tables
  const [clickTimers, setClickTimers] = useState<Record<string, ReturnType<typeof setTimeout>>>({});
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string, type: 'project' | 'table' } | null>(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('colaborador');
  const [isMemberAdding, setIsMemberAdding] = useState(false);
  
  const { toggleFavoriteProject, isSidebarCollapsed, setIsSidebarCollapsed } = useCampaignStore();

  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const timeAgo = (date: any) => {
    if (!date) return 'Hace tiempo';
    try {
      const timestamp = date.seconds ? date.seconds * 1000 : (date instanceof Date ? date.getTime() : new Date(date).getTime());
      if (isNaN(timestamp)) return 'Hace tiempo';
      const seconds = Math.floor((new Date().getTime() - timestamp) / 1000);
      if (seconds < 60) return 'Ahora';
      if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)}m`;
      if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)}h`;
      return `Hace ${Math.floor(seconds / 86400)}d`;
    } catch {
      return 'Hace tiempo';
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem('natic_selected_project', selectedProjectId);
    } else {
      localStorage.removeItem('natic_selected_project');
    }
  }, [selectedProjectId]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuTableId(null);
      setOpenMenuProjectId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const selectedProject = projects.find(p => p.id === selectedProjectId) ?? null;

  // tables belonging to the currently selected project
  const projectTables = useMemo(() => {
    return tables.filter(t => t.projectId === selectedProjectId);
  }, [tables, selectedProjectId]);

  // filtered projects based on search and tab
  const filteredProjects = useMemo(() => {
    let result = [...projects];
    if (searchQuery) {
      result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (activeSidebarTab === 'Favoritos') {
      result = result.filter(p => p.favoriteBy && p.favoriteBy.includes(user?.email?.toLowerCase()));
    }
    return result;
  }, [projects, searchQuery, activeSidebarTab, user]);

  const handleWorkspaceClick = (id: string) => {
    setSelectedProjectId(id);
    setActiveSidebarTab(null);
  };

  const handleTableClick = (projectId: string, tableId: string) => {
    if (clickTimers[tableId]) {
      clearTimeout(clickTimers[tableId]);
      const newTimers = { ...clickTimers };
      delete newTimers[tableId];
      setClickTimers(newTimers);
      onOpenTable(projectId, tableId);
    } else {
      const timer = setTimeout(() => {
        const newTimers = { ...clickTimers };
        delete newTimers[tableId];
        setClickTimers(newTimers);
      }, 300);
      setClickTimers({ ...clickTimers, [tableId]: timer });
    }
  };

  const Sidebar = (
    <motion.aside 
      initial={false}
      animate={{ width: isSidebarCollapsed ? 80 : 260 }}
      transition={{ type: 'spring', damping: 20, stiffness: 120 }}
      className={`relative border-r flex flex-col flex-shrink-0 transition-colors z-40 ${isDarkMode ? 'bg-[#0a0a0f] border-white/5' : 'bg-white border-slate-200'}`}
    >
      {/* Toggle Button - Differentiated Design */}


      <div className={`p-6 ${isSidebarCollapsed ? 'px-0 flex flex-col items-center' : ''}`}>
        <div className={`flex items-center gap-3 mb-10 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!isSidebarCollapsed && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`text-lg font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
            >
              NaticBox
            </motion.span>
          )}
        </div>

        <nav className="space-y-1.5 w-full">
          {[
            { icon: Grid3X3, label: 'Inicio',     active: activeSidebarTab === 'Inicio', onClick: () => { setActiveSidebarTab('Inicio'); setSelectedProjectId(null); } },
            ...(userData?.role === 'admin' || user?.email === 'admin@natic.com' ? [{ icon: Users, label: 'Equipo', active: false, onClick: onManageTeam }] : []),
            { icon: Star,     label: 'Favoritos',   active: activeSidebarTab === 'Favoritos', onClick: () => { setActiveSidebarTab('Favoritos'); setSelectedProjectId(null); } },
            { icon: Clock,    label: 'Recientes',   active: activeSidebarTab === 'Recientes', onClick: () => { setActiveSidebarTab('Recientes'); setSelectedProjectId(null); } },
            { icon: Users,    label: 'Compartidos', active: activeSidebarTab === 'Compartidos', onClick: () => { setActiveSidebarTab('Compartidos'); setSelectedProjectId(null); } },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`w-full flex items-center gap-3 rounded-xl text-xs font-bold transition-all relative group ${
                isSidebarCollapsed ? 'justify-center py-3 px-0' : 'px-4 py-2.5'
              } ${
                item.active 
                  ? (isDarkMode ? 'bg-brand-500/10 text-brand-400' : 'bg-brand-50 text-brand-600')
                  : (isDarkMode ? 'text-slate-500 hover:bg-white/5 hover:text-slate-300' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')
              }`}
              title={isSidebarCollapsed ? item.label : ''}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${item.active ? (isDarkMode ? 'text-brand-400' : 'text-brand-600') : 'text-current opacity-70'}`} />
              {!isSidebarCollapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{item.label}</motion.span>
              )}
              {isSidebarCollapsed && item.active && (
                <motion.div layoutId="activeTab" className="absolute left-0 w-1 h-6 bg-brand-500 rounded-r-full" />
              )}
            </button>
          ))}
        </nav>

        {!isSidebarCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 mb-4 px-4"
          >
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">Espacios</p>
          </motion.div>
        )}
        
        <div className={`space-y-1 mt-6 ${isSidebarCollapsed ? 'px-0 flex flex-col items-center' : 'px-2'} max-h-[350px] overflow-y-auto no-scrollbar`}>
          {projects.map(proj => (
            <div key={proj.id} className="relative group w-full">
              <button
                onClick={() => handleWorkspaceClick(proj.id)}
                className={`w-full flex items-center gap-3 rounded-xl text-xs font-bold transition-all text-left ${
                  isSidebarCollapsed ? 'justify-center py-2.5 px-0' : 'px-3 py-2'
                } ${
                  selectedProjectId === proj.id 
                    ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900')
                    : (isDarkMode ? 'text-slate-500 hover:bg-white/5 hover:text-slate-300' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')
                }`}
                title={isSidebarCollapsed ? proj.name : ''}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm ${hashColor(proj.id, AVATAR_COLORS)}`}>
                  {initials(proj.name)}
                </div>
                {!isSidebarCollapsed && <span className="truncate flex-1">{proj.name}</span>}
              </button>
              {!isSidebarCollapsed && (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setDeleteConfirm({ id: proj.id, name: proj.name, type: 'project' });
                  }}
                  className="absolute right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-all top-1/2 -translate-y-1/2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          <button 
            onClick={onCreateProject}
            className={`w-full flex items-center gap-3 rounded-xl text-xs font-bold transition-all text-slate-500 hover:text-brand-500 hover:bg-brand-500/5 ${isSidebarCollapsed ? 'justify-center py-3 mt-2' : 'px-3 py-2 mt-2'}`}
            title={isSidebarCollapsed ? 'Nuevo espacio' : ''}
          >
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border border-dashed border-slate-700 shrink-0`}>
              <Plus className="w-3.5 h-3.5" />
            </div>
            {!isSidebarCollapsed && <span>Nuevo espacio</span>}
          </button>
        </div>
      </div>

      <div className={`mt-auto p-6 ${isSidebarCollapsed ? 'px-0 flex flex-col items-center' : ''} space-y-2`}>
        <button 
          onClick={onLogout}
          className={`w-full flex items-center gap-3 rounded-xl text-xs font-bold transition-all ${
            isSidebarCollapsed ? 'justify-center py-4 px-0' : 'px-4 py-2.5'
          } ${isDarkMode ? 'text-slate-500 hover:bg-red-500/10 hover:text-red-400' : 'text-slate-500 hover:bg-red-50 hover:text-red-600'}`}
          title={isSidebarCollapsed ? 'Cerrar sesión' : ''}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isSidebarCollapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </motion.aside>
  );

  if (selectedProject) {
    return (
      <div className={`flex h-screen ${isDarkMode ? 'bg-[#0f0f13] text-white' : 'bg-slate-50 text-slate-900'} font-sans overflow-hidden`}>
        {Sidebar}

        <div className="flex-1 relative flex flex-col overflow-hidden">
          {/* Main Fixed Header */}
          <header className={`h-14 flex items-center justify-between px-6 border-b flex-shrink-0 z-30 transition-all ${isDarkMode ? 'border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md' : 'border-slate-200 bg-white/80 backdrop-blur-md shadow-sm'}`}>
            <div className="flex items-center gap-4 min-w-[200px]">
              <button 
                onClick={() => { setSelectedProjectId(null); setActiveSidebarTab('Inicio'); }}
                className={`p-2 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black text-white shadow-lg ${hashColor(selectedProject.id, AVATAR_COLORS)}`}>
                  {initials(selectedProject.name)}
                </div>
                <h1 className={`text-sm font-black tracking-tight truncate max-w-[150px] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedProject.name}</h1>
              </div>
            </div>
            
            <div className="flex-1 flex justify-center px-8">
              <div className="relative w-full max-w-xl group">
                <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isDarkMode ? 'text-slate-500 group-focus-within:text-brand-400' : 'text-slate-400 group-focus-within:text-brand-500'}`} />
                <input
                  type="text"
                  placeholder="Buscar tablas en este espacio..."
                  className={`w-full rounded-xl pl-11 pr-4 py-2 text-xs font-medium transition-all focus:outline-none focus:ring-2 ${
                    isDarkMode 
                      ? 'bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 focus:border-brand-500/50 focus:ring-brand-500/10' 
                      : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-brand-500/10 shadow-inner'
                  }`}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 px-3 py-1.5 rounded-full border transition-all relative overflow-hidden ${
                    isProMode 
                      ? (isDarkMode ? 'border-brand-500/50 bg-brand-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'border-brand-200 bg-brand-50 shadow-sm')
                      : (isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white shadow-sm')
                  }`}
                >
                  {isProMode && (
                    <motion.div 
                      layoutId="ai-glow-home"
                      className="absolute inset-0 bg-gradient-to-r from-brand-500/20 to-pink-500/20 blur-md"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}
                  <div className="flex items-center gap-1.5 relative z-10">
                    <Sparkles className={`w-3.5 h-3.5 transition-colors ${isProMode ? 'text-pink-500' : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${isProMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-pink-500' : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}`}>
                      PRO IA
                    </span>
                  </div>
                  <button 
                    onClick={() => onToggleProMode()}
                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors z-10 ${isProMode ? 'bg-gradient-to-r from-brand-500 to-pink-500' : (isDarkMode ? 'bg-slate-700' : 'bg-slate-300')}`}
                  >
                    <motion.span 
                      animate={{ x: isProMode ? 16 : 2 }}
                      className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform`} 
                    />
                  </button>
                </motion.div>
                
                <button
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}
                  title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>

              <div className={`h-6 w-px ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>
              <UserMenu user={user} userData={userData} onManageTeam={onManageTeam} onManageAccount={onManageAccount} />
            </div>
          </header>

          {/* Project Toolbar */}
          <div className={`h-14 flex items-center justify-between px-6 border-b flex-shrink-0 z-20 transition-all ${isDarkMode ? 'bg-[#0f0f13] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center gap-4">
              <div className={`flex items-center p-1 border rounded-xl overflow-hidden ${isDarkMode ? 'bg-white/[0.03] border-white/10' : 'bg-slate-100/80 border-slate-200'}`}>
                <button className={`p-1.5 rounded-lg transition-all ${isDarkMode ? 'bg-white/10 text-white shadow-lg' : 'bg-white text-brand-600 shadow-sm'}`}>
                  <List className="w-3.5 h-3.5" />
                </button>
                <button className={`p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-all`}>
                  <Grid3X3 className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {projectTables.length} Tablas
              </span>
            </div>

            <button 
              onClick={() => onCreateTable(selectedProject.id)}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-brand-600/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Nueva tabla
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden relative">
            <main className="flex-1 overflow-y-auto p-6 bg-transparent">
              <div className="max-w-4xl mx-auto">
                <div className="space-y-1.5">
                  {projectTables.map(table => (
                    <div
                      key={table.id}
                      onClick={() => handleTableClick(selectedProject.id, table.id)}
                      onMouseEnter={() => setHoveredId(table.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={`group flex items-center gap-4 p-4 card-standard ${
                        isDarkMode ? 'card-dark' : 'card-light'
                      } cursor-pointer select-none`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0 shadow-lg ${hashColor(table.id, TABLE_COLORS)}`}>
                        {initials(table.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{table.name}</h3>
                        <p className={`text-xs mt-1 flex items-center gap-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          <Database className="w-3.5 h-3.5" />
                          Abrir datos · {timeAgo(table.createdAt)}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1.5 transition-opacity ${hoveredId === table.id || table.favoriteBy?.includes(user?.email?.toLowerCase() || '') || openMenuTableId === table.id ? 'opacity-100' : 'opacity-0'}`}>
                        <button 
                          onClick={e => { e.stopPropagation(); useCampaignStore.getState().toggleTableFavorite(table.id); }} 
                          className={`p-2 rounded-xl transition-colors ${table.favoriteBy?.includes(user?.email?.toLowerCase() || '') ? 'text-amber-400 bg-amber-400/10' : (isDarkMode ? 'hover:bg-white/10 text-slate-500 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900')}`}
                        >
                          <Star className="w-4 h-4" fill={table.favoriteBy?.includes(user?.email?.toLowerCase() || '') ? 'currentColor' : 'none'} />
                        </button>
                        
                        <div className="relative">
                          <button 
                            onClick={e => { 
                              e.stopPropagation(); 
                              setOpenMenuTableId(openMenuTableId === table.id ? null : table.id); 
                            }} 
                            className={`p-2 rounded-xl transition-all ${
                              openMenuTableId === table.id
                                ? (isDarkMode ? 'bg-white/10 text-white shadow-lg' : 'bg-slate-100 text-slate-900 shadow-sm')
                                : (isDarkMode ? 'hover:bg-white/10 text-slate-500 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900')
                            }`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          <AnimatePresence>
                            {openMenuTableId === table.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className={`absolute right-0 top-full mt-2 w-48 rounded-2xl shadow-2xl z-50 border p-1.5 backdrop-blur-xl ${
                                  isDarkMode ? 'bg-[#1a1a23]/95 border-white/10' : 'bg-white/95 border-slate-200'
                                }`}
                                onClick={e => e.stopPropagation()}
                              >
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDeleteConfirm({ id: table.id, name: table.name, type: 'table' });
                                    setOpenMenuTableId(null);
                                  }}
                                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all active:scale-95"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Eliminar tabla
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {projectTables.length === 0 && (
                    <div className={`p-12 rounded-3xl border border-dashed text-center flex flex-col items-center justify-center gap-4 ${isDarkMode ? 'border-white/5 bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-2">
                        <Table2 className="w-8 h-8 text-brand-500 opacity-40" />
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>No hay tablas en este espacio</p>
                        <p className="text-xs text-slate-500 mt-1">Crea tu primera tabla para empezar a organizar datos.</p>
                      </div>
                      <button onClick={() => onCreateTable(selectedProject.id)} className="px-6 py-2.5 bg-brand-600 text-white text-xs font-bold rounded-xl shadow-lg hover:bg-brand-500 transition-all active:scale-95">
                        Nueva tabla
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </main>

            <AnimatePresence>
              {showInfoPanel && (
                <motion.aside
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 320, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className={`flex-shrink-0 border-l flex flex-col overflow-hidden relative z-20 ${
                    isDarkMode ? 'border-white/5 bg-[#0a0a0f]' : 'border-slate-100 bg-white'
                  }`}
                >
                  <button
                    onClick={() => setShowInfoPanel(false)}
                    className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-20 rounded-full flex items-center justify-center transition-all z-50 border backdrop-blur-xl group cursor-pointer ${
                      isDarkMode 
                        ? 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:bg-white/10 hover:border-white/20' 
                        : 'bg-white/80 border-slate-200 text-slate-400 hover:text-brand-600 shadow-lg'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4 group-hover:scale-125 transition-transform" />
                  </button>

                  <div className="w-80 h-full overflow-y-auto p-6 space-y-8">
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-20 h-20 rounded-[28%] flex items-center justify-center text-2xl font-black text-white mb-4 shadow-xl ring-4 ${isDarkMode ? 'ring-white/5' : 'ring-white'} ${hashColor(selectedProject.id, AVATAR_COLORS)}`}>
                        {initials(selectedProject.name)}
                      </div>
                      <h2 className={`font-extrabold text-lg leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedProject.name}</h2>
                      <p className="text-xs text-slate-500 mt-2 font-medium">Creado {timeAgo(selectedProject.createdAt)}</p>
                    </div>

                    <div className="h-px bg-white/5" />

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-3">Estadísticas</p>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400 flex items-center gap-2">
                            <Table2 className="w-3.5 h-3.5 text-slate-600" />
                            Tablas
                          </span>
                          <span className="text-xs font-bold text-white">{projectTables.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400 flex items-center gap-2">
                            <Database className="w-3.5 h-3.5 text-slate-600" />
                            Base de datos
                          </span>
                          <span className="text-xs font-bold text-emerald-400">Activa</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Colaboradores</p>
                          <button 
                            onClick={() => {
                              setNewMemberRole('colaborador');
                              setIsMemberModalOpen(true);
                            }}
                            className={`p-1.5 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/5 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-4">
                          {selectedProject.memberEmails?.filter(email => {
                            const role = selectedProject.members?.[email.replace(/\./g, '_')];
                            return role === 'owner' || role === 'admin' || role === 'colaborador' || !role;
                          }).map((email: string) => {
                            const isCurrentUser = email === user?.email?.toLowerCase();
                            const role = selectedProject.members?.[email.replace(/\./g, '_')] || 'colaborador';
                            
                            return (
                              <div key={email} className="flex items-center gap-3 group">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0 shadow-lg ${hashColor(email, AVATAR_COLORS)}`}>
                                  {email.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-xs font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {isCurrentUser ? (userData?.displayName || 'Tú') : email}
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                    {role === 'owner' ? 'Propietario' : role === 'admin' ? 'Administrador' : 'Colaborador'}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="h-px bg-white/5" />

                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Clientes</p>
                          <button 
                            onClick={() => {
                              setNewMemberRole('cliente');
                              setIsMemberModalOpen(true);
                            }}
                            className={`p-1.5 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/5 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-4">
                          {selectedProject.memberEmails?.filter(email => selectedProject.members?.[email.replace(/\./g, '_')] === 'cliente').map((email: string) => (
                            <div key={email} className="flex items-center gap-3 group">
                              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-xs font-black text-white flex-shrink-0 shadow-lg shadow-emerald-500/20">
                                {email.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`text-xs font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{email}</p>
                                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Cliente VIP</p>
                              </div>
                            </div>
                          ))}
                          
                          {selectedProject.memberEmails?.filter(email => selectedProject.members?.[email.replace(/\./g, '_')] === 'cliente').length === 0 && (
                            <p className="text-[10px] text-slate-500 italic px-1">No hay clientes asignados</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            {!showInfoPanel && (
              <button
                onClick={() => setShowInfoPanel(true)}
                className={`fixed right-0 top-1/2 -translate-y-1/2 h-24 w-6 rounded-l-2xl flex flex-col items-center justify-center transition-all z-30 group cursor-pointer border-y border-l backdrop-blur-xl shadow-2xl ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/10 text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 hover:border-brand-500/30' 
                    : 'bg-white/80 border-slate-200 text-slate-400 hover:text-brand-600 shadow-[-4px_0_20px_rgba(0,0,0,0.1)]'
                }`}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-current opacity-40 group-hover:opacity-100 transition-all" />
                  <ChevronLeft className="w-4 h-4 group-hover:scale-125 transition-transform" />
                  <div className="w-1 h-1 rounded-full bg-current opacity-40 group-hover:opacity-100 transition-all" />
                </div>
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isMemberModalOpen && selectedProject && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setIsMemberModalOpen(false);
                  setNewMemberEmail('');
                }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={`relative w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border p-8 ${
                  isDarkMode ? 'bg-[#1a1a23] border-white/10' : 'bg-white border-slate-200'
                }`}
              >
                {/* Modal Header Contextual */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${newMemberRole === 'cliente' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-brand-500/10 text-brand-500'}`}>
                      {newMemberRole === 'cliente' ? <Sparkles className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {newMemberRole === 'cliente' ? 'Invitar Cliente' : 'Invitar Colaborador'}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {newMemberRole === 'cliente' ? 'Acceso exclusivo al portal' : 'Miembro del equipo de trabajo'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => { setIsMemberModalOpen(false); setNewMemberEmail(''); }} className={`p-2 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/10 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form Contextual */}
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newMemberEmail.trim()) return;
                  setIsMemberAdding(true);
                  try {
                    await useCampaignStore.getState().addMemberToProject(selectedProject.id, newMemberEmail.trim().toLowerCase(), newMemberRole);
                    setNewMemberEmail('');
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setIsMemberAdding(false);
                  }
                }} className="space-y-6 mb-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Correo Electrónico</label>
                    <div className="relative group">
                      <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-slate-500 group-focus-within:text-brand-500' : 'text-slate-400 group-focus-within:text-brand-500'}`} />
                      <input 
                        required
                        type="email"
                        placeholder="usuario@ejemplo.com"
                        value={newMemberEmail}
                        onChange={e => setNewMemberEmail(e.target.value)}
                        className={`w-full pl-12 pr-4 py-4 text-xs font-bold rounded-2xl border outline-none transition-all ${
                          isDarkMode ? 'bg-black border-white/10 text-white focus:border-brand-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-brand-500 shadow-inner'
                        }`}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isMemberAdding || !newMemberEmail}
                    className={`w-full py-4 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${
                      newMemberRole === 'cliente'
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                        : 'bg-brand-600 hover:bg-brand-500 shadow-brand-600/20'
                    }`}
                  >
                    {isMemberAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    {newMemberRole === 'cliente' ? 'Agregar Cliente' : 'Agregar Colaborador'}
                  </button>
                </form>

                {/* List Contextual (Solo muestra los del mismo rol) */}
                <div className="max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 px-1">
                    {newMemberRole === 'cliente' ? 'Clientes Actuales' : 'Colaboradores Actuales'}
                  </p>
                  <div className="space-y-2">
                    {selectedProject.memberEmails?.filter(email => {
                      const role = selectedProject.members?.[email.replace(/\./g, '_')] || 'colaborador';
                      if (newMemberRole === 'cliente') return role === 'cliente';
                      return role !== 'cliente'; // Admins, owners y colaboradores entran aquí para el modal de equipo
                    }).length === 0 ? (
                      <p className="text-[10px] text-slate-600 italic px-1">No hay {newMemberRole === 'cliente' ? 'clientes' : 'colaboradores'} todavía.</p>
                    ) : (
                      selectedProject.memberEmails?.filter(email => {
                        const role = selectedProject.members?.[email.replace(/\./g, '_')] || 'colaborador';
                        if (newMemberRole === 'cliente') return role === 'cliente';
                        return role !== 'cliente';
                      }).map(email => {
                        const role = selectedProject.members?.[email.replace(/\./g, '_')] || 'colaborador';
                        const emailKey = email.replace(/\./g, '_');
                        const allowedTables = selectedProject.clientPermissions?.[emailKey] || [];
                        
                        return (
                          <div key={email} className={`flex flex-col p-4 rounded-2xl border transition-all group gap-3 ${
                            newMemberRole === 'cliente' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-white/5 border-white/5'
                          }`}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white ${newMemberRole === 'cliente' ? 'bg-emerald-500' : hashColor(email, AVATAR_COLORS)}`}>
                                  {email[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white truncate">{email === user?.email?.toLowerCase() ? 'Tú' : email}</p>
                                  <p className={`text-[9px] uppercase font-black tracking-widest ${newMemberRole === 'cliente' ? 'text-emerald-500' : 'text-slate-500'}`}>
                                    {role === 'owner' ? 'Propietario' : role === 'admin' ? 'Admin' : role}
                                  </p>
                                </div>
                              </div>
                              {email !== user?.email?.toLowerCase() && (
                                <button 
                                  onClick={async () => {
                                    if (window.confirm(`¿Remover a ${email}?`)) {
                                      await useCampaignStore.getState().removeMemberFromProject(selectedProject.id, email);
                                    }
                                  }}
                                  className="p-2 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Si es cliente, mostrar los permisos granulares de tablas dentro del modal también */}
                            {role === 'cliente' && (
                              <div className="pt-2 border-t border-white/5">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Tablas permitidas:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {projectTables.map(t => (
                                    <button
                                      key={t.id}
                                      onClick={() => {
                                        const newPerms = allowedTables.includes(t.id)
                                          ? allowedTables.filter(id => id !== t.id)
                                          : [...allowedTables, t.id];
                                        useCampaignStore.getState().setClientPermissions(selectedProject.id, email, newPerms);
                                      }}
                                      className={`px-2 py-1 rounded-lg text-[8px] font-bold transition-all border ${
                                        allowedTables.includes(t.id)
                                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                          : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'
                                      }`}
                                    >
                                      {t.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {deleteConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDeleteConfirm(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={`relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border ${
                  isDarkMode ? 'bg-[#1a1a23] border-white/10' : 'bg-white border-slate-200'
                }`}
              >
                <div className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6">
                    <Trash2 className="w-8 h-8" />
                  </div>
                  <h3 className={`text-xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    ¿Eliminar {deleteConfirm.type === 'project' ? 'espacio' : 'tabla'}?
                  </h3>
                  <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                    Estás a punto de borrar <span className="font-bold text-slate-400">"{deleteConfirm.name}"</span>. 
                    Esta acción no se puede deshacer.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        isDarkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!deleteConfirm) return;
                        
                        try {
                          if (deleteConfirm.type === 'project') {
                            onDeleteProject({ id: deleteConfirm.id, name: deleteConfirm.name });
                          } else {
                            await useCampaignStore.getState().deleteTable(deleteConfirm.id);
                          }
                        } catch (err) {
                          console.error("Error deleting:", err);
                        } finally {
                          setDeleteConfirm(null);
                        }
                      }}
                      className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-[#0f0f13] text-white' : 'bg-slate-50 text-slate-900'} font-sans overflow-hidden`}>
      {Sidebar}

      <div className="flex-1 relative flex flex-col overflow-hidden">
        <header className={`h-14 flex items-center justify-between px-6 border-b flex-shrink-0 ${isDarkMode ? 'border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md' : 'border-slate-200 bg-white/80 backdrop-blur-md'}`}>
          <div className="flex items-center gap-4 min-w-[200px]"></div>
          
          <div className="flex-1 flex justify-center px-8">
            <div className="relative w-full max-w-xl group">
              <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isDarkMode ? 'text-slate-500 group-focus-within:text-brand-400' : 'text-slate-400 group-focus-within:text-brand-500'}`} />
              <input
                type="text"
                placeholder="Buscar espacios de trabajo..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full rounded-xl pl-11 pr-4 py-2.5 text-xs font-medium transition-all focus:outline-none focus:ring-2 ${
                  isDarkMode 
                    ? 'bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 focus:border-brand-500/50 focus:ring-brand-500/10 shadow-inner' 
                    : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-brand-500/10 shadow-sm'
                }`}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-3 px-3 py-1.5 rounded-full border transition-all ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white shadow-sm'}`}>
                <div className="flex items-center gap-1.5">
                  <Sparkles className={`w-3.5 h-3.5 transition-colors ${isProMode ? 'text-pink-500' : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${isProMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-pink-500' : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}`}>
                    PRO IA
                  </span>
                </div>
                <button 
                  onClick={() => onToggleProMode()}
                  className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${isProMode ? 'bg-gradient-to-r from-brand-500 to-pink-500' : (isDarkMode ? 'bg-slate-700' : 'bg-slate-300')}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${isProMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}
                title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>

            <div className={`h-6 w-px mx-1 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>
            <UserMenu user={user} userData={userData} onManageTeam={onManageTeam} onManageAccount={onManageAccount} />
          </div>
        </header>

        <div className={`h-14 flex items-center justify-between px-6 border-b flex-shrink-0 transition-colors ${isDarkMode ? 'bg-[#0f0f13] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-4">
            <h1 className={`text-sm font-bold tracking-tight truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {activeSidebarTab === 'Inicio' ? 'Panel de Control' : 'Espacios de trabajo'}
            </h1>
          </div>

          <div className="w-1/4 flex items-center justify-end gap-3">
            <div className={`flex items-center p-1 border rounded-xl overflow-hidden ${isDarkMode ? 'bg-white/[0.03] border-white/10' : 'bg-slate-100/80 border-slate-200'}`}>
              <button 
                onClick={() => setViewMode('list')} 
                className={`p-1.5 rounded-lg transition-all ${viewMode==='list'?(isDarkMode ? 'bg-white/10 text-white shadow-lg' : 'bg-white text-brand-600 shadow-sm'):'text-slate-500 hover:text-slate-300'}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setViewMode('grid')} 
                className={`p-1.5 rounded-lg transition-all ${viewMode==='grid'?(isDarkMode ? 'bg-white/10 text-white shadow-lg' : 'bg-white text-brand-600 shadow-sm'):'text-slate-500 hover:text-slate-300'}`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
            </div>
            <button onClick={onCreateProject} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-brand-600/20 active:scale-95">
              <Plus className="w-4 h-4" />
              Nuevo espacio
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6 bg-transparent">
          {activeSidebarTab === 'Inicio' && !searchQuery ? (
            <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                  {userData?.photoURL ? (
                    <img src={userData.photoURL} alt={userData.displayName || 'User'} className={`w-16 h-16 rounded-2xl object-cover shadow-xl ring-4 ${isDarkMode ? 'ring-white/5' : 'ring-slate-100'}`} />
                  ) : (
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-xl ${hashColor(user?.email || 'A', AVATAR_COLORS)}`}>
                       {initials(userData?.displayName || user?.email || 'U')}
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Hola, {userData?.displayName?.split(' ')[0] || user?.email?.split('@')[0]} 👋</h1>
                    <p className="text-sm text-slate-400">Aquí tienes el resumen de tu equipo hoy.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
                {[
                  { label: 'Espacios', value: projects.length, icon: Grid3X3, color: 'text-violet-500', bg: 'bg-violet-500/10' },
                  { label: 'Tablas', value: tables.length, icon: Table2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { label: 'Favoritos', value: projects.filter(p => p.favoriteBy?.includes(user?.email?.toLowerCase())).length, icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                  { label: 'Miembros', value: 'Gestión', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10', onClick: onManageTeam }
                ].map((stat, i) => (
                  <div key={i} onClick={stat.onClick} className={`p-6 card-standard ${isDarkMode ? 'card-dark' : 'card-light'} ${stat.onClick ? 'cursor-pointer' : ''}`}>
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} shadow-sm`}>
                        <stat.icon className={`w-7 h-7 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
                        <p className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} leading-none`}>{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-violet-400" />
                    Espacios Recientes
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {projects.slice(0, 4).map(proj => (
                      <div
                        key={proj.id}
                        onClick={() => handleWorkspaceClick(proj.id)}
                        className={`group flex items-center gap-4 p-4 card-standard ${isDarkMode ? 'card-dark' : 'card-light'} cursor-pointer`}
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0 shadow-lg ${hashColor(proj.id, AVATAR_COLORS)}`}>
                          {initials(proj.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-sm font-bold truncate group-hover:text-brand-500 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{proj.name}</h3>
                          <p className="text-[10px] text-slate-500 mt-1 font-medium">{timeAgo(proj.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                    <Table2 className="w-4 h-4 text-blue-400" />
                    Últimas Tablas
                  </h2>
                  <div className="space-y-3">
                    {tables.slice(0, 5).map(table => {
                      const proj = projects.find(p => p.id === table.projectId);
                      return (
                        <div
                          key={table.id}
                          onClick={() => onOpenTable(table.projectId, table.id)}
                          className={`flex items-center justify-between p-4 card-standard ${isDarkMode ? 'card-dark' : 'card-light'} cursor-pointer group`}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={`w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm`}>
                              <Database className="w-4 h-4 text-brand-500" />
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{table.name}</p>
                              <p className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">{proj?.name || 'Desconocido'}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-600 font-medium">{filteredProjects.length} espacio{filteredProjects.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {filteredProjects.length === 0 && activeSidebarTab !== 'Favoritos' && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <p className="text-slate-400 font-medium text-sm">
                    {searchQuery ? `Sin resultados para "${searchQuery}"` : 'No tienes espacios de trabajo'}
                  </p>
                </div>
              )}

              {/* List view (Projects) */}
              {viewMode === 'list' && filteredProjects.length > 0 && (
                <div className="space-y-1.5 max-w-3xl">
                  {filteredProjects.map(proj => (
                    <div
                      key={proj.id}
                      onClick={() => handleWorkspaceClick(proj.id)}
                      onMouseEnter={() => setHoveredId(proj.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={`group flex items-center gap-4 p-4 card-standard ${isDarkMode ? 'card-dark' : 'card-light'} cursor-pointer select-none`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0 shadow-lg ${hashColor(proj.id, AVATAR_COLORS)}`}>
                        {initials(proj.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{proj.name}</h3>
                          {activeSidebarTab === 'Favoritos' && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${isDarkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>Espacio</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 font-medium">{timeAgo(proj.createdAt)}</p>
                      </div>
                      <div className={`flex items-center gap-1.5 transition-opacity ${hoveredId === proj.id || (proj.favoriteBy && proj.favoriteBy.includes(user?.email?.toLowerCase())) || openMenuProjectId === proj.id ? 'opacity-100' : 'opacity-0'}`}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavoriteProject(proj.id, user?.email || ''); }}
                          className={`p-2 rounded-xl transition-colors ${proj.favoriteBy && proj.favoriteBy.includes(user?.email?.toLowerCase()) ? 'text-amber-400 bg-amber-400/10' : (isDarkMode ? 'text-slate-500 hover:text-amber-400 hover:bg-white/10' : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100')}`}
                        >
                          <Star className={`w-4 h-4 ${proj.favoriteBy && proj.favoriteBy.includes(user?.email?.toLowerCase()) ? 'fill-current' : ''}`} />
                        </button>
                        <div className="relative">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setOpenMenuProjectId(openMenuProjectId === proj.id ? null : proj.id);
                            }}
                            className={`p-2 rounded-xl transition-all ${
                              openMenuProjectId === proj.id
                                ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900')
                                : (isDarkMode ? 'hover:bg-white/10 text-slate-500 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900')
                            }`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          <AnimatePresence>
                            {openMenuProjectId === proj.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className={`absolute right-0 top-full mt-2 w-52 rounded-2xl shadow-2xl z-50 border p-1.5 backdrop-blur-xl ${
                                  isDarkMode ? 'bg-[#1a1a23]/95 border-white/10' : 'bg-white/95 border-slate-200'
                                }`}
                                onClick={e => e.stopPropagation()}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuProjectId(null);
                                    handleWorkspaceClick(proj.id);
                                  }}
                                  className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                                    isDarkMode ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <Grid3X3 className="w-4 h-4" />
                                  Abrir espacio
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavoriteProject(proj.id, user?.email || '');
                                    setOpenMenuProjectId(null);
                                  }}
                                  className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                                    isDarkMode ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <Star className={`w-4 h-4 ${ proj.favoriteBy?.includes(user?.email?.toLowerCase()) ? 'text-amber-400 fill-current' : '' }`} />
                                  {proj.favoriteBy?.includes(user?.email?.toLowerCase()) ? 'Quitar favorito' : 'Agregar a favoritos'}
                                </button>
                                <div className={`my-1 h-px ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`} />
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDeleteConfirm({ id: proj.id, name: proj.name, type: 'project' });
                                    setOpenMenuProjectId(null);
                                  }}
                                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all active:scale-95"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Eliminar espacio
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Favoritos - Tablas Section */}
              {activeSidebarTab === 'Favoritos' && (
                <div className="mt-12 max-w-3xl">
                  <h2 className={`text-sm font-bold flex items-center gap-2 mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <Star className="w-4 h-4 text-amber-400 fill-current" />
                    Tablas Favoritas
                  </h2>
                  <div className="space-y-1.5">
                    {tables.filter(t => t.favoriteBy?.includes(user?.email?.toLowerCase())).length === 0 ? (
                      <div className={`p-8 rounded-2xl border border-dashed text-center ${isDarkMode ? 'border-white/5 bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
                        <p className="text-xs text-slate-500">No tienes tablas marcadas como favoritas todavía.</p>
                      </div>
                    ) : (
                      tables.filter(t => t.favoriteBy?.includes(user?.email?.toLowerCase())).map(table => {
                        const proj = projects.find(p => p.id === table.projectId);
                        return (
                          <div
                            key={table.id}
                            onClick={() => onOpenTable(table.projectId, table.id)}
                            className={`group flex items-center gap-4 p-4 card-standard ${isDarkMode ? 'card-dark' : 'card-light'} cursor-pointer select-none`}
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0 shadow-lg ${hashColor(table.id, TABLE_COLORS)}`}>
                              {initials(table.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{table.name}</h3>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${isDarkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>Tabla</span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1 font-medium flex items-center gap-1.5">
                                <Grid3X3 className="w-3 h-3" />
                                {proj?.name || 'Espacio desconocido'}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={(e) => { e.stopPropagation(); useCampaignStore.getState().toggleTableFavorite(table.id); }}
                                className="p-2 rounded-xl text-amber-400 bg-amber-400/10 transition-all hover:scale-110"
                              >
                                <Star className="w-4 h-4 fill-current" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Grid view */}
              {viewMode === 'grid' && filteredProjects.length > 0 && activeSidebarTab !== 'Favoritos' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredProjects.map(proj => (
                    <div
                      key={proj.id}
                      onClick={() => handleWorkspaceClick(proj.id)}
                      className={`relative group flex flex-col items-center gap-4 p-6 card-standard ${isDarkMode ? 'card-dark' : 'card-light'} cursor-pointer text-center shadow-lg`}
                    >
                      <div className={`w-16 h-16 rounded-[28%] flex items-center justify-center text-xl font-black text-white shadow-xl ${hashColor(proj.id, AVATAR_COLORS)}`}>
                        {initials(proj.name)}
                      </div>
                      <div className="min-w-0 w-full">
                        <h3 className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{proj.name}</h3>
                        <p className="text-[10px] text-slate-500 mt-1.5 font-medium">{timeAgo(proj.createdAt)}</p>
                      </div>
                      <div className={`absolute top-3 right-3 flex items-center gap-1.5 transition-opacity ${proj.favoriteBy && proj.favoriteBy.includes(user?.email?.toLowerCase()) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavoriteProject(proj.id, user?.email || ''); }}
                          className={`p-1.5 rounded-lg transition-colors ${proj.favoriteBy && proj.favoriteBy.includes(user?.email?.toLowerCase()) ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-amber-400 hover:bg-white/10'}`}
                        >
                          <Star className={`w-4 h-4 ${proj.favoriteBy && proj.favoriteBy.includes(user?.email?.toLowerCase()) ? 'fill-current' : ''}`} />
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setDeleteConfirm({ id: proj.id, name: proj.name, type: 'project' });
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-all"
                          title="Eliminar espacio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border ${
                isDarkMode ? 'bg-[#1a1a23] border-white/10' : 'bg-white border-slate-200'
              }`}
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className={`text-xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  ¿Eliminar {deleteConfirm.type === 'project' ? 'espacio' : 'tabla'}?
                </h3>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                  Estás a punto de borrar <span className="font-bold text-slate-400">"{deleteConfirm.name}"</span>. 
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isDarkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!deleteConfirm) return;
                      
                      try {
                        if (deleteConfirm.type === 'project') {
                          onDeleteProject({ id: deleteConfirm.id, name: deleteConfirm.name });
                        } else {
                          await useCampaignStore.getState().deleteTable(deleteConfirm.id);
                        }
                      } catch (err) {
                        console.error("Error deleting:", err);
                      } finally {
                        setDeleteConfirm(null);
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
