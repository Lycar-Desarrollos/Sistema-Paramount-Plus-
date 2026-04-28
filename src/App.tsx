import React, { useState, useEffect } from 'react';
import { Sparkles, Database, Zap as ZapIcon, Layout, FormInput, Clock, Share2, Users, LogOut, Plus, CheckCircle2, Pencil, Sun, Moon } from 'lucide-react';
import Dashboard from './components/Dashboard';
import GridEngine from './components/GridEngine';
import KanbanBoard from './components/KanbanBoard';
import GalleryView from './components/GalleryView';
import Login from './components/Login';
import CreateProjectModal from './components/CreateProjectModal';
import { useAuth } from './context/AuthContext';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

import { ChevronDown, X } from 'lucide-react';
import { useCampaignStore } from './store/useCampaignStore';

type MainTab = 'datos' | 'automatizaciones' | 'interfaces' | 'formularios';

export default function App() {
  const { user, userData, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<MainTab>('datos');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  
  const [projectToDelete, setProjectToDelete] = useState<{id: string, name: string} | null>(null);

  const [isProMode, setIsProMode] = useState(false);
  const [isAiSimulating, setIsAiSimulating] = useState(false);
  const [aiLoadingText, setAiLoadingText] = useState('');

  const activeProjectId = useCampaignStore(state => state.activeProjectId);
  const setActiveProjectId = useCampaignStore(state => state.setActiveProjectId);
  const projects = useCampaignStore(state => state.projects);
  const initializeGlobal = useCampaignStore(state => state.initializeGlobal);
  const addProject = useCampaignStore(state => state.addProject);
  const updateProjectName = useCampaignStore(state => state.updateProjectName);
  const deleteProject = useCampaignStore(state => state.deleteProject);
  
  useEffect(() => {
    if (!user) return;
    const unsub = initializeGlobal();
    return () => unsub();
  }, [user, initializeGlobal]);

  const handleRenameSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingProjectId && editingProjectName.trim()) {
      await updateProjectName(editingProjectId, editingProjectName.trim());
    }
    setEditingProjectId(null);
  };

  const handleProToggle = () => {
    if (!isProMode) {
      setIsAiSimulating(true);
      setAiLoadingText('Analizando espacio de trabajo...');
      
      setTimeout(() => setAiLoadingText('Optimizando flujos de datos...'), 1500);
      setTimeout(() => setAiLoadingText('Agente IA activado y listo.'), 3000);
      
      setTimeout(() => {
        setIsAiSimulating(false);
        setIsProMode(true);
      }, 3500);
    } else {
      setIsProMode(false);
    }
  };

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || { name: 'Cargando...' };

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-[#030305]"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className={`flex flex-col h-screen font-sans overflow-hidden selection:bg-brand-500/30 transition-colors duration-500 ${isDarkMode ? 'bg-[#030305] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* AI Agent Simulation Overlay */}
      {isAiSimulating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0f]/90 backdrop-blur-xl">
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-t-2 border-brand-500 rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-r-2 border-pink-500 rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
              <div className="absolute inset-4 border-b-2 border-purple-500 rounded-full animate-[spin_2s_linear_infinite]"></div>
              <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-white animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">NaticBox AI Agent</h2>
            <p className="text-brand-300 font-mono text-sm">{aiLoadingText}</p>
          </div>
        </div>
      )}

      {isCreatingProject && (
        <CreateProjectModal 
          onClose={() => setIsCreatingProject(false)} 
          onCreate={async (name, template) => {
            await addProject(name, template);
          }} 
          isDarkMode={isDarkMode}
        />
      )}

      {/* Workspace Switcher Modal */}
      {isWorkspaceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsWorkspaceModalOpen(false)}></div>
          <div className={`relative w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-full animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-[#13131a] border border-white/10' : 'bg-white border border-slate-200'}`}>
            
            {/* Header */}
            <div className={`px-8 py-6 border-b flex items-center justify-between ${isDarkMode ? 'border-white/5 bg-[#1a1a24]/50' : 'border-slate-100 bg-slate-50/50'}`}>
              <div>
                <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Tus espacios de trabajo</h2>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Selecciona un proyecto para continuar trabajando.</p>
              </div>
              <button 
                onClick={() => setIsWorkspaceModalOpen(false)}
                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* DELETE PROJECT MODAL */}
            {projectToDelete && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className={`border rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden ${
                  isDarkMode ? 'bg-[#13131a] border-white/10' : 'bg-white border-slate-200'
                }`}>
                  <div className={`p-6 border-b flex items-start gap-4 ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    </div>
                    <div>
                      <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Eliminar espacio</h3>
                      <p className={`text-sm mt-2 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        ¿Estás seguro de que deseas eliminar el espacio <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>"{projectToDelete.name}"</span>? Esta acción eliminará permanentemente todos los datos y no se puede deshacer.
                      </p>
                    </div>
                  </div>
                  <div className={`p-6 flex items-center justify-end gap-3 ${isDarkMode ? 'bg-white/[0.02] border-t border-white/5' : 'bg-slate-50 border-t border-slate-100'}`}>
                    <button 
                      onClick={() => setProjectToDelete(null)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        isDarkMode ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={async () => {
                        await deleteProject(projectToDelete.id);
                        setProjectToDelete(null);
                      }}
                      className="px-6 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                    >
                      Sí, eliminar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Body: Grid of Projects */}
            <div className="p-8 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map(proj => {
                  const isActive = activeProjectId === proj.id;
                  const isEditing = editingProjectId === proj.id;

                  return (
                    <div
                      key={proj.id}
                      className={`relative group flex items-start p-5 rounded-2xl border text-left transition-all duration-300 ${
                        isActive 
                          ? (isDarkMode ? 'bg-brand-500/10 border-brand-500 ring-1 ring-brand-500 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'bg-brand-50 border-brand-500 ring-1 ring-brand-500 shadow-md')
                          : (isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20' : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300')
                      }`}
                    >
                      <button
                        onClick={() => {
                          if (isEditing) return;
                          setActiveProjectId(proj.id);
                          setIsWorkspaceModalOpen(false);
                        }}
                        className="absolute inset-0 w-full h-full cursor-pointer rounded-2xl"
                        style={{ pointerEvents: isEditing ? 'none' : 'auto' }}
                      />

                      <div className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mr-4 ${
                        isActive
                          ? 'bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-lg shadow-brand-500/30'
                          : (isDarkMode ? 'bg-[#2a2a35] text-slate-400 group-hover:text-white' : 'bg-slate-100 text-slate-500 group-hover:text-slate-900')
                      }`}>
                        <Layout className="w-6 h-6" />
                      </div>
                      <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-center">
                        {isEditing ? (
                          <form onSubmit={handleRenameSubmit} className="mb-1">
                            <input
                              type="text"
                              autoFocus
                              value={editingProjectName}
                              onChange={(e) => setEditingProjectName(e.target.value)}
                              onBlur={() => handleRenameSubmit()}
                              className={`w-full bg-transparent font-semibold border-b ${isDarkMode ? 'border-brand-500 text-white focus:outline-none' : 'border-brand-500 text-slate-900 focus:outline-none'}`}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </form>
                        ) : (
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-semibold truncate transition-colors ${
                              isActive 
                                ? (isDarkMode ? 'text-white' : 'text-brand-900') 
                                : (isDarkMode ? 'text-slate-300 group-hover:text-white' : 'text-slate-700 group-hover:text-slate-900')
                            }`}>
                              {proj.name}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingProjectId(proj.id);
                                  setEditingProjectName(proj.name);
                                }}
                                className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md ${isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}
                                title="Renombrar espacio"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              
                              {!isActive && projects.length > 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProjectToDelete({ id: proj.id, name: proj.name });
                                  }}
                                  className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-red-500/10 hover:text-red-500 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                                  title="Eliminar espacio"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          Creado el {new Date(proj.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {isActive && !isEditing && (
                        <div className="relative z-10 w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/20 mt-3">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Create New Project Card */}
                <button 
                  onClick={() => {
                    setIsWorkspaceModalOpen(false);
                    setIsCreatingProject(true);
                  }}
                  className={`group flex items-center justify-center gap-3 p-5 rounded-2xl border border-dashed transition-all duration-300 ${
                    isDarkMode 
                      ? 'border-white/20 hover:border-brand-500 hover:bg-brand-500/5 text-slate-400 hover:text-brand-400' 
                      : 'border-slate-300 hover:border-brand-500 hover:bg-brand-50 text-slate-500 hover:text-brand-600'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isDarkMode ? 'bg-white/5 group-hover:bg-brand-500/20' : 'bg-slate-100 group-hover:bg-brand-100'
                  }`}>
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-sm">Crear nuevo espacio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar (Airtable style) */}
      <header className={`h-14 flex items-center justify-between px-4 border-b z-20 ${isDarkMode ? 'bg-[#0a0a0f]/90 backdrop-blur-md border-dark-border' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 rounded-[10px] bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className={`text-xl font-bold tracking-tight hidden sm:block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              NaticBox
            </span>
          </div>

          <div className={`h-5 w-px mx-1 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>

          <div className="relative">
            <button 
              onClick={() => setIsWorkspaceModalOpen(true)}
              className={`flex items-center gap-2 font-semibold text-sm tracking-tight px-3 py-1.5 rounded-md transition-colors ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-slate-900 hover:bg-slate-100'}`}
            >
              {activeProject.name}
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Center Tabs */}
        <div className="hidden lg:flex flex-1 justify-center items-center space-x-1 h-full mx-4">
          {[
            { id: 'datos', label: 'Datos', icon: Database },
            { id: 'automatizaciones', label: 'Automatizaciones', icon: ZapIcon },
            { id: 'interfaces', label: 'Interfaces', icon: Layout },
            { id: 'formularios', label: 'Formularios', icon: FormInput }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as MainTab)}
              className={`h-full flex items-center gap-2 px-4 text-sm font-medium border-b-2 transition-all ${
                currentTab === tab.id
                  ? 'border-brand-500 text-brand-400'
                  : `border-transparent ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'}`
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* PRO AI Toggle */}
          <div className={`flex items-center gap-3 px-3 py-1.5 rounded-full border transition-all ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white shadow-sm'}`}>
            <div className="flex items-center gap-1.5">
              <Sparkles className={`w-3.5 h-3.5 transition-colors ${isProMode ? 'text-pink-500' : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}`} />
              <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${isProMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-pink-500' : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}`}>
                PRO IA
              </span>
            </div>
            <button 
              onClick={() => handleProToggle()}
              className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${isProMode ? 'bg-gradient-to-r from-brand-500 to-pink-500' : (isDarkMode ? 'bg-slate-700' : 'bg-slate-300')}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${isProMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}
            title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/10">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-white">{userData?.role === 'administrador' ? 'Admin' : 'Ops'}</p>
              <p className="text-[10px] text-slate-400 max-w-[100px] truncate">{user.email}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-pink-500 text-white flex items-center justify-center text-sm font-bold border border-white/10 shadow-sm cursor-pointer" title={user.email || 'User'}>
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <button 
              onClick={() => signOut(auth)}
              className="p-2 ml-1 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Ambient Glows */}
        {isDarkMode && (
          <>
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[120px] -z-10 pointer-events-none mix-blend-screen"></div>
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[100px] -z-10 pointer-events-none mix-blend-screen"></div>
          </>
        )}

        <div className="flex-1 overflow-auto flex flex-col">
          {currentTab === 'datos' && <GridEngine isDarkMode={isDarkMode} />}
          {currentTab === 'interfaces' && (
             <div className="p-8">
               <Dashboard title="Interfaces" icon={Layout} isDarkMode={isDarkMode} />
             </div>
          )}
          {currentTab === 'automatizaciones' && (
             <div className="h-full">
               <KanbanBoard isDarkMode={isDarkMode} />
             </div>
          )}
          {currentTab === 'formularios' && (
             <div className="p-8 h-full">
               <Dashboard title="Formularios" icon={FormInput} isDarkMode={isDarkMode} />
             </div>
          )}
        </div>
      </main>
    </div>
  );
}
