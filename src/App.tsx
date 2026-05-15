// NaticBox App - Main Entry Point
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Database, Zap as ZapIcon, Layout, FormInput, LogOut, Plus, CheckCircle2, Pencil, Sun, Moon, Download, FileSpreadsheet, FileText, Clipboard, ChevronDown as ChevronDownIcon, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { UserMenu } from './components/UserMenu';
import Dashboard from './components/Dashboard';
import GridEngine from './components/GridEngine';
import KanbanEngine from './components/KanbanEngine';
import CalendarEngine from './components/CalendarEngine';
import { useToast } from './components/Toast';

import Login from './components/Login';
import CreateProjectModal from './components/CreateProjectModal';
import CreateTableModal from './components/CreateTableModal';
import CustomDialog from './components/CustomDialog';
import TeamPage from './components/TeamPage';
import AccountPage from './components/AccountPage';
import GalleryView from './components/GalleryView';
import MarketingHub from './pages/marketing/MarketingHub';
import HomePage from './components/HomePage';
import PublicFormView from './components/PublicFormView';
import AIChat from './components/AIChat';
import RecordDetailModal from './components/RecordDetailModal';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

import { ChevronDown, X, MessageSquare, Globe, Lock, Calendar } from 'lucide-react';
import { useCampaignStore, DEFAULT_COLUMNS_V2, DEFAULT_FORM_COLUMNS, type ColumnType } from './store/useCampaignStore';

type MainTab = 'datos' | 'automatizaciones' | 'interfaces' | 'marketing';



export default function App() {
  if (window.location.pathname.startsWith('/form/')) {
    return <PublicFormView />;
  }

  const { showToast } = useToast();
  const { user, userData, loading: authLoading } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [currentTab, setCurrentTab] = useState<MainTab>('datos');
  const [showHome, setShowHome] = useState(() => {
    const saved = localStorage.getItem('natic_show_home');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [appReady, setAppReady] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isCreateTableModalOpen, setIsCreateTableModalOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showTeamManagement, setShowTeamManagement] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'confirm' | 'prompt' | 'danger';
    onConfirm: (val?: string) => void;
    defaultValue?: string;
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    onConfirm: () => {},
  });
  
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  



  const { 
    activeProjectId, setActiveProjectId, 
    activeTableId, setActiveTableId,
    projects, tables, records, 
    initializeGlobal, initializeProjectData, initializeTableData,
    addProject, addTable, updateTable, deleteTable,
    addRecord, updateRecordField, 
    updateProjectName, deleteProject,
    isProMode, setIsProMode,
    isAiSimulating, setIsAiSimulating,
    aiLoadingText, setAiLoadingText,
    triggerAiSimulation,
    isSidebarCollapsed, setIsSidebarCollapsed,
    isAiOpen, setIsAiOpen,
    loading: dataLoading 
  } = useCampaignStore();
  
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || { id: '', name: 'Cargando...' };
  const activeTable = tables.find(t => t.id === activeTableId) || tables[0] || { id: '', name: 'Sin tablas', columnDefinitions: [] };

  useEffect(() => {
    localStorage.setItem('natic_show_home', JSON.stringify(showHome));
  }, [showHome]);

  useEffect(() => {
    if (!user) return;
    
    // Load persisted IDs
    const savedProjectId = localStorage.getItem('natic_active_project_id');
    const savedTableId = localStorage.getItem('natic_active_table_id');
    if (savedProjectId) setActiveProjectId(savedProjectId);
    if (savedTableId) setActiveTableId(savedTableId);

    const unsub = initializeGlobal(user, userData);
    // After a short delay, mark app as ready (Firebase snapshot should have arrived)
    const timer = setTimeout(() => setAppReady(true), 800);
    return () => { unsub(); clearTimeout(timer); };
  }, [user, userData, initializeGlobal]);

  useEffect(() => {
    if (!user || !activeProjectId) return;
    const unsub = initializeProjectData(activeProjectId);
    return () => unsub();
  }, [user, activeProjectId, initializeProjectData]);

  useEffect(() => {
    if (!user || !activeTableId) return;
    const unsub = initializeTableData(activeTableId);
    
    localStorage.setItem('natic_active_table_id', activeTableId);
    return () => unsub();
  }, [user, activeTableId, initializeTableData]);

  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('natic_active_project_id', activeProjectId);
    }
  }, [activeProjectId]);

  const handleRenameSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingProjectId && editingProjectName.trim()) {
      await updateProjectName(editingProjectId, editingProjectName.trim());
    }
    setEditingProjectId(null);
  };

  const handleProToggle = () => {
    if (!isProMode) {
      triggerAiSimulation(['Iniciando NaticBox AI...', 'Sincronizando modelos neuronales...', 'Agente IA activado y listo.'], 2500)
        .then(() => setIsProMode(true));
    } else {
      // Small feedback even when deactivating
      setIsProMode(false);
    }
  };

  const handleExport = (format: 'xlsx' | 'csv' | 'copy') => {
    if (!activeTable || records.length === 0) return;
    
    const exportData = records.map(rec => {
      const mapped: Record<string, any> = {};
      const cols = activeTable.columnDefinitions || [];
      
      cols.forEach(col => {
        const val = rec.values[col.id];
        mapped[col.name] = typeof val === 'object' ? JSON.stringify(val) : val;
      });
      
      return mapped;
    });

    if (format === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, activeTable.name || 'Datos');
      XLSX.writeFile(workbook, `${activeTable.name || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } else if (format === 'csv') {
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${activeTable.name || 'export'}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'copy') {
      const text = JSON.stringify(exportData, null, 2);
      navigator.clipboard.writeText(text);
      showToast('Datos copiados al portapapeles', 'info');
    }
    
    setShowExportMenu(false);
  };



  if (authLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-[#030305]"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    return <Login />;
  }

  // Wait for Firebase to return initial data
  if (!appReady) {
    return <div className="h-screen w-screen flex items-center justify-center bg-[#030305]"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (showTeamManagement) {
    return (
      <>
        <TeamPage onBack={() => setShowTeamManagement(false)} user={user} userData={userData} activeProjectId={activeProjectId} isProMode={isProMode} onToggleProMode={handleProToggle} />

      </>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (showAccountSettings) {
    return (
      <>
        <AccountPage user={user} userData={userData} onBack={() => setShowAccountSettings(false)} isProMode={isProMode} onToggleProMode={handleProToggle} />

      </>
    );
  }

  if (showHome) {
    return (
      <>
        <HomePage 
          user={user} 
          userData={userData}
          projects={projects}
          tables={tables}
          isProMode={isProMode}
          onToggleProMode={handleProToggle}
          onLogout={() => signOut(auth)}
          onOpenProject={(id) => {
            setActiveProjectId(id);
            setShowHome(false);
          }}
          onOpenTable={(projectId, tableId) => {
            setActiveProjectId(projectId);
            setActiveTableId(tableId);
            setShowHome(false);
          }}
          onCreateProject={() => setIsCreatingProject(true)}
          onDeleteProject={(project) => deleteProject(project.id)}
          onManageTeam={() => setShowTeamManagement(true)}
          onManageAccount={() => setShowAccountSettings(true)}
          onCreateTable={(projectId) => {
            setActiveProjectId(projectId);
            setIsCreateTableModalOpen(true);
          }}
        />
        {isCreatingProject && (
          <CreateProjectModal 
            onClose={() => setIsCreatingProject(false)} 
            onCreate={async (name, templateObj, rows) => {
              const template = templateObj ? 'marketing' : 'general';
              await addProject(name, template);              setIsCreatingProject(false);
              if (rows && rows.length > 0) {
                const state = useCampaignStore.getState();
                const newProjectId = state.activeProjectId;
                const newTableId = state.activeTableId;
                if (newProjectId && newTableId) {
                  await state.importRows(newProjectId, newTableId, rows);
                }
              }
              setShowHome(false);
            }} 
          />
        )}
        {isCreateTableModalOpen && (
          <CreateTableModal
            onClose={() => setIsCreateTableModalOpen(false)}
            onCreate={async (name, template, rows, type) => {
              const cols = template
                ? template.columns.map(id => ({
                    id,
                    name: template.labels[id] || id,
                    type: 'text' as ColumnType
                  }))
                : (type === 'requests' ? DEFAULT_FORM_COLUMNS : DEFAULT_COLUMNS_V2);

              await addTable(activeProjectId, name, type || 'general', cols);

              if (rows && rows.length > 0) {
                const state = useCampaignStore.getState();
                const newTableId = state.activeTableId;
                if (activeProjectId && newTableId) {
                  await state.importRows(activeProjectId, newTableId, rows);
                }
              }
              showToast(`Tabla "${name}" creada con éxito`, 'success');
            }}
          />
        )}
        <CustomDialog
          isOpen={dialogConfig.isOpen}
          onClose={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))}
          onConfirm={dialogConfig.onConfirm}
          title={dialogConfig.title}
          message={dialogConfig.message}
          type={dialogConfig.type}
          defaultValue={dialogConfig.defaultValue}
          confirmText={dialogConfig.confirmText}
        />
      </>
    );
  }

  return (
    <div className={`flex flex-col h-screen font-sans overflow-hidden selection:bg-brand-500/30 transition-colors duration-500 ${isDarkMode ? 'bg-[#030305] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* AI Agent Simulation Overlay */}
      {/* isAiSimulating overlay removed */}

      {isCreatingProject && (
        <CreateProjectModal 
          onClose={() => setIsCreatingProject(false)} 
          onCreate={async (name, templateObj, rows) => {
            const template = templateObj ? 'marketing' : 'general';
            await addProject(name, template);
            setIsCreatingProject(false);
            if (rows && rows.length > 0) {
              const state = useCampaignStore.getState();
              const newProjectId = state.activeProjectId;
              const newTableId = state.activeTableId;
              if (newProjectId && newTableId) {
                await state.importRows(newProjectId, newTableId, rows);
              }
            }
            setShowHome(false);
          }} 
        />
      )}

      {isWorkspaceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsWorkspaceModalOpen(false)}></div>
          <div className={`relative w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-full animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-[#13131a] border border-white/10' : 'bg-white border border-slate-200'}`}>
            
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
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  useCampaignStore.getState().updateProjectVisibility(proj.id, proj.visibility === 'public' ? 'private' : 'public');
                                }}
                                className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md ${isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'} ${proj.visibility === 'public' ? 'text-green-500 hover:text-green-600' : ''}`}
                                title={proj.visibility === 'public' ? 'Hacer Privado' : 'Hacer Público'}
                              >
                                {proj.visibility === 'public' ? <Globe className="w-3.5 h-3.5 text-green-500" /> : <Lock className="w-3.5 h-3.5" />}
                              </button>

                              {!isActive && projects.length > 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteProject(proj.id);
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

      <header className={`h-14 flex-shrink-0 flex items-center justify-between px-4 border-b z-20 ${isDarkMode ? 'bg-[#0a0a0f]/90 backdrop-blur-md border-dark-border' : 'bg-white/80 backdrop-blur-md border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setShowHome(true)} title="Ir al inicio">
            <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className={`text-xl font-bold tracking-tight hidden sm:block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              NaticBox
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(userData?.role === 'admin' || user?.uid === 'RXH1eN22BtUAdJBrK4bPR3AxiO52') && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white shadow-sm'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Notificaciones
              </span>
              <button 
                onClick={() => setIsAiOpen(!isAiOpen)}
                className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${isAiOpen ? 'bg-emerald-500' : (isDarkMode ? 'bg-slate-700' : 'bg-slate-300')}`}
              >
                <motion.span 
                  animate={{ x: isAiOpen ? 16 : 2 }}
                  className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform`} 
                />
              </button>
            </div>
          )}

          <button 
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}
            title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <UserMenu user={user} userData={userData} onManageTeam={() => setShowTeamManagement(true)} onManageAccount={() => setShowAccountSettings(true)} />
        </div>
      </header>

      {/* Main Tabs Toolbar */}
      <div className={`h-12 flex-shrink-0 flex items-center justify-between px-6 border-b z-10 transition-colors ${isDarkMode ? 'bg-[#0f0f13] border-white/5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="w-1/4 flex items-center">
          <button 
            onClick={() => setIsWorkspaceModalOpen(true)}
            className={`flex items-center gap-2 font-bold text-sm tracking-tight px-3 py-1.5 rounded-xl transition-all truncate ${
              isDarkMode 
                ? 'text-white hover:bg-white/5 border border-transparent hover:border-white/10' 
                : 'text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-200'
            }`}
          >
            {activeProject.name}
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </button>
        </div>

        <div className="flex-1 flex justify-center h-full">
          <div className="flex items-center space-x-1 h-full">
            {[
              { id: 'datos', label: 'Tabla', icon: Database },
              { id: 'automatizaciones', label: 'Flujos', icon: ZapIcon },
              { id: 'interfaces', label: 'Calendario', icon: Calendar },
              { id: 'marketing', label: 'Insights', icon: Sparkles }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as MainTab)}
                className={`h-full flex items-center gap-2 px-6 text-xs font-bold border-b-2 transition-all ${
                  currentTab === tab.id
                    ? 'border-brand-500 text-brand-500 bg-brand-500/[0.03]'
                    : `border-transparent ${isDarkMode ? 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-1/4 flex items-center justify-end">
           {/* Placeholder to maintain balance for centering */}
        </div>
      </div>

      <main className="flex-1 flex overflow-hidden relative">
        {isDarkMode && (
          <>
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-600/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-600/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          </>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {currentTab === 'datos' && (
            <main className="flex-1 flex flex-col overflow-hidden relative">
              <div className={`flex items-center px-6 border-b h-12 transition-colors ${isDarkMode ? 'bg-[#0f0f13]/80 backdrop-blur-sm border-white/5' : 'bg-white/80 backdrop-blur-sm border-slate-200'}`}>
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar h-full mr-4 flex-1">
                  {tables.filter(t => t.projectId === activeProjectId).map(table => (
                    <div
                      key={table.id}
                      onClick={() => setActiveTableId(table.id)}
                      className={`group relative flex items-center h-full px-5 text-xs font-bold cursor-pointer transition-all border-b-2 ${
                        activeTableId === table.id
                          ? (isDarkMode ? 'text-white border-brand-500 bg-brand-500/5' : 'text-slate-900 border-brand-500 bg-brand-50')
                          : (isDarkMode ? 'text-slate-500 border-transparent hover:text-slate-300' : 'text-slate-500 border-transparent hover:text-slate-900')
                      }`}
                    >
                      <span>{table.name}</span>

                      {table.type === 'requests' && !table.isInitial && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const url = `${window.location.origin}/form/${table.id}`;
                            navigator.clipboard.writeText(url).then(() => {
                              showToast('Link de formulario copiado', 'info');
                            });
                          }}
                          className={`ml-2 p-1 rounded-md transition-all hover:bg-emerald-500/10 text-emerald-500`}
                          title="Copiar link del formulario"
                        >
                          <Globe className="w-3 h-3" />
                        </button>
                      )}
                      
                      <div className="flex items-center ml-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDialogConfig({
                              isOpen: true,
                              title: 'Renombrar tabla',
                              message: 'Ingresa el nuevo nombre para esta tabla:',
                              type: 'prompt',
                              defaultValue: table.name,
                              onConfirm: (newName) => {
                                if (newName) updateTable(table.id, newName);
                              }
                            });
                          }}
                          className={`p-1 rounded-md transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                        >
                          <Pencil className="w-3 h-3 text-slate-500" />
                        </button>
                        {tables.length > 1 && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setDialogConfig({
                                isOpen: true,
                                title: 'Eliminar tabla',
                                message: '¿Estás seguro de que deseas eliminar esta tabla permanentemente?',
                                type: 'confirm',
                                onConfirm: () => deleteTable(table.id)
                              });
                            }}
                            className={`p-1 rounded-md transition-colors ${isDarkMode ? 'hover:bg-red-500/10 hover:text-red-500' : 'hover:bg-red-50'}`}
                          >
                            <Trash2 className="w-3 h-3 text-slate-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setIsCreateTableModalOpen(true)} className={`flex items-center gap-1.5 px-4 h-full text-xs font-black uppercase tracking-widest transition-all border-b-2 border-transparent ${isDarkMode ? 'text-slate-500 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}>
                    <Plus className="w-3.5 h-3.5" />
                    Nueva
                  </button>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isDarkMode 
                        ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white' 
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar</span>
                  </button>
                </div>
              </div>

              <GridEngine />
            </main>
          )}

          {currentTab === 'automatizaciones' && activeTableId && (
            <KanbanEngine tableId={activeTableId} />
          )}

          {currentTab === 'interfaces' && activeTableId && (
            <CalendarEngine tableId={activeTableId} />
          )}

          {currentTab === 'marketing' && (
            <MarketingHub />
          )}

        </div>

        {isCreateTableModalOpen && (
          <CreateTableModal
            onClose={() => setIsCreateTableModalOpen(false)}
            onCreate={async (name, template, rows, type) => {
              const cols = template
                ? template.columns.map(id => ({
                    id,
                    name: template.labels[id] || id,
                    type: 'text' as ColumnType
                  }))
                : (type === 'requests' ? DEFAULT_FORM_COLUMNS : DEFAULT_COLUMNS_V2);

              await addTable(activeProjectId, name, type || 'general', cols);

              if (rows && rows.length > 0) {
                const state = useCampaignStore.getState();
                const newTableId = state.activeTableId;                if (activeProjectId && newTableId) {
                  await state.importRows(activeProjectId, newTableId, rows);
                }
              }
              setShowHome(false);
            }}
          />
        )}

        <CustomDialog
          isOpen={dialogConfig.isOpen}
          onClose={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))}
          onConfirm={dialogConfig.onConfirm}
          title={dialogConfig.title}
          message={dialogConfig.message}
          type={dialogConfig.type}
          defaultValue={dialogConfig.defaultValue}
          confirmText={dialogConfig.confirmText}
        />

        {/* AI Chat — Admin Only, Secret FAB */}
        {!showHome && <AIChat userData={userData} user={user} />}
        
        {/* Global Record Detail Modal */}
        <RecordDetailModal />

      </main>
    </div>
  );
}
