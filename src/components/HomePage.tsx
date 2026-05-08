import React, { useState, useEffect } from 'react';
import { Plus, Search, Grid3X3, List, Star, Clock, Users, LogOut, Sparkles, MoreHorizontal, Database, ArrowLeft, Table2, Trash2, Sun, Moon } from 'lucide-react';
import { useCampaignStore, type Project, type Table } from '../store/useCampaignStore';
import { useTheme } from '../context/ThemeContext';

// ─── helpers ───────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500',
  'bg-teal-500', 'bg-blue-500',  'bg-indigo-500','bg-violet-500',
  'bg-pink-500', 'bg-rose-500',
];

const TABLE_COLORS = [
  'bg-emerald-600', 'bg-cyan-600', 'bg-blue-600', 'bg-violet-600',
  'bg-fuchsia-600', 'bg-rose-600', 'bg-orange-600', 'bg-teal-600',
];

function hashColor(id: string, palette: string[]): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function timeAgo(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  const h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (m < 1)  return 'Hace un momento';
  if (m < 60) return `Hace ${m} minuto${m > 1 ? 's' : ''}`;
  if (h < 24) return `Hace ${h} hora${h > 1 ? 's' : ''}`;
  if (d < 30) return `Hace ${d} día${d > 1 ? 's' : ''}`;
  return new Date(ts).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

import { UserMenu } from './UserMenu';

// ─── types ─────────────────────────────────────────────────────────────────
interface Props {
  projects: Project[];
  tables: Table[];
  user: any;
  userData: any;
  isProMode: boolean;
  onToggleProMode: () => void;
  /** Single click on workspace → load its tables (without entering the app) */
  onPreviewProject: (projectId: string) => void;
  /** Double click on a table → enter the app at that table */
  onOpenTable: (projectId: string, tableId: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (project: {id: string, name: string}) => void;
  onManageTeam: () => void;
  onManageAccount: () => void;
  onCreateTable: (projectId: string) => void;
}

// ─── component ─────────────────────────────────────────────────────────────
export default function HomePage({
  projects, tables, user, userData, isProMode, onToggleProMode,
  onPreviewProject, onOpenTable, onCreateProject, onDeleteProject, onManageTeam, onManageAccount, onCreateTable
}: Props) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [searchQuery, setSearchQuery]         = useState('');
  const [viewMode, setViewMode]               = useState<'grid'|'list'>('list');
  const [activeSidebarTab, setActiveSidebarTab] = useState<'Inicio'|'Favoritos'|'Recientes'|'Compartidos'|null>('Inicio');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    () => localStorage.getItem('natic_selected_project') ?? null
  );
  const [hoveredId, setHoveredId]             = useState<string | null>(null);
  const [newMemberEmail, setNewMemberEmail]   = useState('');
  // double-click detection for tables
  const [clickTimers, setClickTimers]         = useState<Record<string, ReturnType<typeof setTimeout>>>({});
  
  const { addMemberToProject, removeMemberFromProject, toggleFavoriteProject } = useCampaignStore();

  // Persist selected project across refreshes
  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem('natic_selected_project', selectedProjectId);
    } else {
      localStorage.removeItem('natic_selected_project');
    }
  }, [selectedProjectId]);

  const selectedProject = projects.find(p => p.id === selectedProjectId) ?? null;

  // tables belonging to the currently selected project
  const projectTables = tables.filter(t => t.projectId === selectedProjectId);

  let filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (activeSidebarTab === 'Favoritos') {
    filteredProjects = filteredProjects.filter(p => p.favoriteBy && p.favoriteBy.includes(user?.email?.toLowerCase()));
  } else if (activeSidebarTab === 'Compartidos') {
    filteredProjects = filteredProjects.filter(p => p.memberEmails && p.memberEmails.includes(user?.email?.toLowerCase() || ''));
  }

  // ── single click on workspace → preview its tables
  const handleWorkspaceClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveSidebarTab(null);
    onPreviewProject(projectId);
    setSearchQuery('');
  };

  // ─── shared sidebar ───────────────────────────────────────────────────────
  const Sidebar = (
    <aside className={`w-60 flex-shrink-0 border-r flex flex-col ${isDarkMode ? 'bg-[#0f0f13] border-white/5' : 'bg-white border-slate-200'}`}>
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/5 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-bold text-base tracking-tight">NaticBox</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {[
          { icon: Sparkles, label: 'Inicio',      active: activeSidebarTab === 'Inicio' },
          { icon: Star,     label: 'Favoritos',   active: activeSidebarTab === 'Favoritos' },
          { icon: Clock,    label: 'Recientes',   active: activeSidebarTab === 'Recientes' },
          { icon: Users,    label: 'Compartidos', active: activeSidebarTab === 'Compartidos' },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => { 
              setActiveSidebarTab(item.label as any);
              setSelectedProjectId(null); 
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              item.active ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </button>
        ))}

        {/* Workspaces list in sidebar */}
        <div className="pt-4">
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Espacios</span>
            <button onClick={onCreateProject} className="w-5 h-5 flex items-center justify-center rounded text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          {projects.map(proj => (
            <div key={proj.id} className="relative group w-full flex items-center">
              <button
                onClick={() => handleWorkspaceClick(proj.id)}
                className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left truncate ${
                  selectedProjectId === proj.id
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
                }`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 ${hashColor(proj.id, AVATAR_COLORS)}`}>
                  {initials(proj.name)}
                </div>
                <span className="truncate">{proj.name}</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteProject({id: proj.id, name: proj.name}); }}
                className="absolute right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-all"
                title="Eliminar espacio"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );

  // ─── TABLE LIST VIEW (when a workspace is selected) ───────────────────────
  if (selectedProject) {
    return (
      <div className={`flex h-screen font-sans overflow-hidden ${isDarkMode ? 'bg-[#0f0f13] text-white' : 'bg-slate-50 text-slate-900'}`}>
        {Sidebar}

        {/* Center: table list */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Header */}
          <header className="h-14 flex items-center justify-between px-6 border-b border-white/5 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedProjectId(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white ${hashColor(selectedProject.id, AVATAR_COLORS)}`}>
                {initials(selectedProject.name)}
              </div>
              <h1 className="text-sm font-semibold text-white">{selectedProject.name}</h1>
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

              <div className="h-6 w-px bg-white/10 mx-1"></div>
              <UserMenu user={user} userData={userData} onManageTeam={onManageTeam} />
            </div>
          </header>

          {/* Tables */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                <Clock className="w-3.5 h-3.5" />
                Último abierto
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar tablas..."
                    className="bg-[#13131a] border border-white/8 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 w-48 transition-all shadow-sm"
                  />
                </div>
                <button
                  onClick={async () => {
                    const store = useCampaignStore.getState();
                    await store.addTable(selectedProject.id, `Tabla ${projectTables.length + 1}`);
                    const newTableId = useCampaignStore.getState().activeTableId;
                    if (newTableId) {
                      onOpenTable(selectedProject.id, newTableId);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-all shadow-lg shadow-violet-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nueva tabla
                </button>
              </div>
            </div>

            {projectTables.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <Table2 className="w-7 h-7 text-slate-600" />
                </div>
                <p className="text-slate-400 font-medium text-sm">No hay tablas en este espacio</p>
                <p className="text-slate-600 text-xs mt-1">Haz clic en Nueva tabla para comenzar</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-w-2xl">
                {projectTables.map((table) => (
                    <div
                      key={table.id}
                      onClick={() => onOpenTable(selectedProject.id, table.id)}
                      onMouseEnter={() => setHoveredId(table.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className="group flex items-center gap-4 p-3.5 rounded-xl border border-white/5 bg-[#13131a] hover:border-white/15 hover:bg-[#1a1a24] cursor-pointer transition-all duration-150 select-none"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-lg ${hashColor(table.id, TABLE_COLORS)}`}>
                        {initials(table.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{table.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <Database className="w-3 h-3" />
                          Abrir datos · {timeAgo(table.createdAt)}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1 transition-opacity ${hoveredId === table.id || table.favoriteBy?.includes(user?.email?.toLowerCase() || '') ? 'opacity-100' : 'opacity-0'}`}>
                        <button 
                          onClick={e => { e.stopPropagation(); useCampaignStore.getState().toggleTableFavorite(table.id); }} 
                          className={`p-1.5 rounded-lg transition-colors ${table.favoriteBy?.includes(user?.email?.toLowerCase() || '') ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-400/10' : 'hover:bg-white/10 text-slate-400 hover:text-white'}`}
                        >
                          <Star className="w-3.5 h-3.5" fill={table.favoriteBy?.includes(user?.email?.toLowerCase() || '') ? 'currentColor' : 'none'} />
                        </button>
                        <button onClick={e => e.stopPropagation()} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                ))}
              </div>
            )}
          </main>
        </div>

        {/* ── Right info panel ───────────────────────────────────────────── */}
        <aside className="w-64 flex-shrink-0 border-l border-white/5 flex flex-col overflow-y-auto">
          <div className="p-5 space-y-6">

            {/* Workspace info */}
            <div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white mb-3 shadow-lg ${hashColor(selectedProject.id, AVATAR_COLORS)}`}>
                {initials(selectedProject.name)}
              </div>
              <h2 className="font-bold text-white text-sm leading-tight">{selectedProject.name}</h2>
              <p className="text-xs text-slate-500 mt-1">Creado {timeAgo(selectedProject.createdAt)}</p>

            </div>

            <div className="h-px bg-white/5" />

            {/* Stats */}
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

            {/* Collaborators */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-3">Colaboradores</p>
              
              <div className="space-y-3">
                {/* Propietario */}
                <div className="flex items-center gap-2.5">
                  {user?.photoURL
                    ? <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10 flex-shrink-0" />
                    : <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                      </div>
                  }
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{user?.displayName || user?.email || 'Tú'}</p>
                    <p className="text-[10px] text-slate-500">Propietario</p>
                  </div>
                </div>

                {/* Lista de emails añadidos */}
                {selectedProject.memberEmails?.filter((email: string) => email !== user?.email?.toLowerCase()).map((email: string) => (
                  <div key={email} className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{email}</p>
                      <p className="text-[10px] text-slate-500">Invitado</p>
                    </div>
                    {userData?.role === 'admin' && (
                      <button 
                        onClick={() => removeMemberFromProject(selectedProject.id, email)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Eliminar invitado"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {userData?.role === 'admin' && (
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newMemberEmail.trim()) return;
                    await addMemberToProject(selectedProject.id, newMemberEmail.trim());
                    setNewMemberEmail('');
                  }}
                  className="mt-4 flex items-center gap-2"
                >
                  <input 
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="Añadir email..."
                    className={`flex-1 min-w-0 bg-[#13131a] border border-white/8 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all shadow-sm`}
                  />
                  <button type="submit" className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md">
                    +
                  </button>
                </form>
              )}
            </div>

          </div>
        </aside>
      </div>
    );
  }

  // ─── WORKSPACES LIST (default / home) ─────────────────────────────────────
  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-[#0f0f13] text-white' : 'bg-slate-50 text-slate-900'} font-sans overflow-hidden`}>
      {Sidebar}

      <div className="flex-1 relative flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className={`h-14 flex items-center justify-between px-6 border-b flex-shrink-0 ${isDarkMode ? 'border-white/5' : 'border-slate-200 bg-white'}`}>
          <h1 className="text-sm font-semibold">
            {activeSidebarTab === 'Inicio' ? 'Panel de Control' : 'Espacios de trabajo'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar espacios..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`border rounded-lg pl-8 pr-3 py-1.5 text-xs transition-all shadow-sm w-56 focus:outline-none focus:border-violet-500 ${
                    isDarkMode 
                      ? 'bg-[#13131a] border-white/10 text-white placeholder-slate-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                  }`}
                />
              </div>
              <button onClick={onCreateProject} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-all shadow-lg shadow-violet-500/20">
                <Plus className="w-3.5 h-3.5" />
                Nuevo espacio
              </button>
            </div>

            <div className="h-6 w-px bg-white/10"></div>

            <div className="flex items-center border border-white/8 rounded-lg overflow-hidden bg-[#0f0f13]">
              <button onClick={() => setViewMode('list')} className={`px-2 py-1.5 transition-colors ${viewMode==='list'?'bg-white/10 text-white':'text-slate-500 hover:text-white hover:bg-white/5'}`}><List className="w-3.5 h-3.5" /></button>
              <button onClick={() => setViewMode('grid')} className={`px-2 py-1.5 transition-colors ${viewMode==='grid'?'bg-white/10 text-white':'text-slate-500 hover:text-white hover:bg-white/5'}`}><Grid3X3 className="w-3.5 h-3.5" /></button>
            </div>
            <div className="h-6 w-px bg-white/10 mx-1"></div>

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

        {/* Workspace list / grid / Dashboard */}
        <main className="flex-1 overflow-y-auto p-6">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {[
                  { label: 'Espacios', value: projects.length, icon: Grid3X3, color: 'text-violet-400', bg: 'bg-violet-400/10' },
                  { label: 'Tablas', value: tables.length, icon: Table2, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                  { label: 'Favoritos', value: projects.filter(p => p.favoriteBy?.includes(user?.email?.toLowerCase())).length, icon: Star, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                  { label: 'Miembros', value: 'Gestión', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-400/10', onClick: onManageTeam }
                ].map((stat, i) => (
                  <div key={i} onClick={stat.onClick} className={`p-5 rounded-2xl border border-white/5 bg-[#13131a] ${stat.onClick ? 'cursor-pointer hover:border-white/15 hover:bg-[#1a1a24] transition-colors' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-white leading-none">{stat.value}</p>
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
                        className="group flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-[#13131a] hover:border-white/15 hover:bg-[#1a1a24] cursor-pointer transition-all"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-lg ${hashColor(proj.id, AVATAR_COLORS)}`}>
                          {initials(proj.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white truncate group-hover:text-violet-400 transition-colors">{proj.name}</h3>
                          <p className="text-[10px] text-slate-500 mt-0.5">{timeAgo(proj.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <div className="col-span-2 p-6 rounded-xl border border-dashed border-white/10 text-center">
                         <p className="text-sm text-slate-500">No hay espacios todavía</p>
                      </div>
                    )}
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
                          className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-[#13131a] hover:border-white/15 hover:bg-[#1a1a24] cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                              <Database className="w-3.5 h-3.5 text-blue-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate">{table.name}</p>
                              <p className="text-[10px] text-slate-500 truncate">{proj?.name || 'Desconocido'}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {tables.length === 0 && (
                      <div className={`p-6 rounded-xl border border-dashed text-center ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                         <p className="text-sm text-slate-500">Aún no hay tablas</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                    <Clock className="w-3.5 h-3.5" />
                    Último abierto
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <span className="text-xs text-slate-600">{filteredProjects.length} espacio{filteredProjects.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {filteredProjects.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <p className="text-slate-400 font-medium text-sm">
                    {searchQuery ? `Sin resultados para "${searchQuery}"` : 'No tienes espacios de trabajo'}
                  </p>
                  {!searchQuery && (
                    <button onClick={onCreateProject} className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-all">
                      Crear primer espacio
                    </button>
                  )}
                </div>
              )}

              {/* List view */}
              {viewMode === 'list' && filteredProjects.length > 0 && (
                <div className="space-y-1.5 max-w-3xl">
                  {filteredProjects.map(proj => (
                    <div
                      key={proj.id}
                      onClick={() => handleWorkspaceClick(proj.id)}
                      onMouseEnter={() => setHoveredId(proj.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className="group flex items-center gap-4 p-3.5 rounded-xl border border-white/5 bg-[#13131a] hover:border-white/15 hover:bg-[#1a1a24] cursor-pointer transition-all duration-150"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0 shadow-lg ${hashColor(proj.id, AVATAR_COLORS)}`}>
                        {initials(proj.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{proj.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{timeAgo(proj.createdAt)}</p>
                      </div>
                      <div className={`flex items-center gap-1 transition-opacity ${hoveredId === proj.id || (proj.favoriteBy && proj.favoriteBy.includes(user?.email?.toLowerCase())) ? 'opacity-100' : 'opacity-0'}`}>
                        <button onClick={e => { e.stopPropagation(); onDeleteProject({id: proj.id, name: proj.name}); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors" title="Eliminar espacio">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavoriteProject(proj.id, user?.email || ''); }}
                          className={`p-1.5 rounded-lg transition-colors ${proj.favoriteBy && proj.favoriteBy.includes(user?.email?.toLowerCase()) ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 hover:text-amber-400 hover:bg-white/10'}`}
                        >
                          <Star className={`w-3.5 h-3.5 ${proj.favoriteBy && proj.favoriteBy.includes(user?.email?.toLowerCase()) ? 'fill-current' : ''}`} />
                        </button>
                        <button onClick={e => e.stopPropagation()} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><MoreHorizontal className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Grid view */}
              {viewMode === 'grid' && filteredProjects.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredProjects.map(proj => (
                    <div
                      key={proj.id}
                      onClick={() => handleWorkspaceClick(proj.id)}
                      className="relative group flex flex-col items-center gap-3 p-5 rounded-xl border border-white/5 bg-[#13131a] hover:border-white/15 hover:bg-[#1a1a24] cursor-pointer transition-all text-center"
                    >
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold text-white ${hashColor(proj.id, AVATAR_COLORS)}`}>
                        {initials(proj.name)}
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-white truncate max-w-[120px]">{proj.name}</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">{timeAgo(proj.createdAt)}</p>
                      </div>
                      <div className={`absolute top-2 right-2 flex items-center gap-1 transition-opacity ${proj.favoriteBy && proj.favoriteBy.includes(user?.email?.toLowerCase()) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavoriteProject(proj.id, user?.email || ''); }}
                          className={`p-1.5 rounded-lg transition-colors ${proj.favoriteBy && proj.favoriteBy.includes(user?.email?.toLowerCase()) ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 hover:text-amber-400 hover:bg-white/10'}`}
                        >
                          <Star className={`w-3.5 h-3.5 ${proj.favoriteBy && proj.favoriteBy.includes(user?.email?.toLowerCase()) ? 'fill-current' : ''}`} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDeleteProject({id: proj.id, name: proj.name}); }}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all"
                          title="Eliminar espacio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div onClick={onCreateProject} className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl border border-dashed transition-all group cursor-pointer ${
                    isDarkMode ? 'border-white/10 hover:border-violet-500/50 hover:bg-violet-500/5' : 'border-slate-300 hover:border-brand-500 hover:bg-brand-50'
                  }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'bg-white/5 group-hover:bg-violet-500/20' : 'bg-slate-100 group-hover:bg-brand-100'}`}>
                      <Plus className={`w-5 h-5 ${isDarkMode ? 'text-slate-400 group-hover:text-violet-400' : 'text-slate-500 group-hover:text-brand-600'}`} />
                    </div>
                    <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400 group-hover:text-violet-400' : 'text-slate-500 group-hover:text-brand-600'}`}>Crear espacio</span>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
