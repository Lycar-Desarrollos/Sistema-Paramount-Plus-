import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowUpDown, Plus, LayoutGrid, EyeOff, Settings, Trash2, CheckCircle2, Edit2 } from 'lucide-react';
import { useCampaignStore, DEFAULT_CATEGORIES } from '../store/useCampaignStore';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

const COLORS = [
  'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'bg-slate-500/20 text-slate-300 border-slate-500/30'
];

const Tag = ({ children, colorClass, onClick }: { children: React.ReactNode, colorClass: string, onClick?: () => void }) => {
  if (!children) return null;
  return (
    <span 
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap border cursor-pointer hover:opacity-80 transition-opacity",
        colorClass
      )}
    >
      {children}
    </span>
  );
};

const EditableHeader = ({ field, minW = '90px', onDelete }: { field: string, minW?: string, onDelete?: (field: string) => void }) => {
  const { isDarkMode } = useTheme();
  const label = useCampaignStore(state => state.columnLabels[field]);
  const updateColumnLabel = useCampaignStore(state => state.updateColumnLabel);
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(label || field);

  useEffect(() => {
    setValue(label || field);
  }, [label, field]);

  const handleBlur = () => {
    setIsEditing(false);
    if (value.trim() !== (label || field) && value.trim() !== '') {
      updateColumnLabel(field, value.trim());
    } else {
      setValue(label || field);
    }
  };

  return (
    <th className={`p-0 border-r min-w-[${minW}] transition-colors relative group ${
      isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'
    }`}>
      {isEditing ? (
        <input 
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={e => e.key === 'Enter' && handleBlur()}
          className={`w-full h-full min-h-[44px] text-center outline-none px-2 text-brand-500 font-bold ${
            isDarkMode ? 'bg-[#1a1a24]' : 'bg-white'
          }`}
        />
      ) : (
        <div 
          onClick={() => setIsEditing(true)}
          className="w-full h-full min-h-[44px] px-3 flex items-center justify-center gap-1 cursor-pointer group-hover:text-white"
        >
          {label || field}
          <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity ml-1" />
          {onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(field); }} 
              className="absolute top-1 right-1 p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </th>
  );
};

const EditableMainHeader = ({ field }: { field: string }) => {
  const { isDarkMode } = useTheme();
  const label = useCampaignStore(state => state.columnLabels[field]);
  const updateColumnLabel = useCampaignStore(state => state.updateColumnLabel);
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(label);

  useEffect(() => { setValue(label); }, [label]);

  const handleBlur = () => {
    setIsEditing(false);
    if (value.trim() !== label && value.trim() !== '') {
      updateColumnLabel(field, value.trim());
    } else {
      setValue(label);
    }
  };

  return (
    <th className={`p-0 border-r min-w-[250px] group cursor-pointer transition-colors relative ${
      isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'
    }`}>
      {isEditing ? (
        <input 
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={e => e.key === 'Enter' && handleBlur()}
          className={`w-full h-full min-h-[44px] outline-none px-3 text-brand-500 font-bold ${
            isDarkMode ? 'bg-[#1a1a24]' : 'bg-white'
          }`}
        />
      ) : (
        <div onClick={() => setIsEditing(true)} className="w-full h-full min-h-[44px] px-3 flex items-center gap-2 group-hover:text-white">
          <span className="text-slate-500 font-mono text-[10px] opacity-70">Aa</span> 
          {label}
          <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity ml-auto" />
        </div>
      )}
    </th>
  );
};

export default function GridEngine() {
  const { isDarkMode } = useTheme();
  const { 
    campaigns, loading, error, initializeProjectData, 
    addCampaign, updateCampaignField, deleteCampaigns, 
    columnLabels, columns, addColumn, deleteColumn, activeProjectId 
  } = useCampaignStore();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);

  useEffect(() => {
    if (!activeProjectId) return;
    const unsubscribe = initializeProjectData(activeProjectId);
    return () => unsubscribe();
  }, [activeProjectId, initializeProjectData]);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteSelected = async () => {
    setIsDeletingSelected(true);
  };

  const confirmDeleteSelected = async () => {
    await deleteCampaigns(selectedIds);
    setSelectedIds([]);
    setIsDeletingSelected(false);
  };

  const getCategoryColor = (cat: string | null) => {
    switch (cat) {
      case 'Priority (L)': return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'Moderate (M)': return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'Tentpole (XL)': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const DataCell = ({ id, field, value, activeColor }: { id: string, field: string, value: any, activeColor: string }) => {
    const currentLabel = columnLabels[field] || String(field);
    const [editing, setEditing] = useState(false);
    const [localVal, setLocalVal] = useState(String(value ?? ''));

    useEffect(() => { setLocalVal(String(value ?? '')); }, [value]);

    // If the stored value is a real boolean, keep checkbox behavior
    if (typeof value === 'boolean') {
      return (
        <td
          className={`p-0 border-r cursor-pointer transition-colors group/cell relative ${isDarkMode ? 'border-white/5 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'}`}
          onClick={() => updateCampaignField(id, field, !value)}
        >
          <div className="flex items-center justify-center h-full min-h-[44px] w-full">
            {value ? (
              <Tag colorClass={activeColor}>{currentLabel}</Tag>
            ) : (
              <div className="w-4 h-4 rounded border border-white/10 group-hover/cell:border-white/30 transition-colors"></div>
            )}
          </div>
        </td>
      );
    }

    // All other values: render as editable text
    return (
      <td className={`p-0 border-r min-w-[120px] relative group/cell ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
        {editing ? (
          <input
            autoFocus
            value={localVal}
            onChange={e => setLocalVal(e.target.value)}
            onBlur={() => { setEditing(false); updateCampaignField(id, field, localVal); }}
            onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); updateCampaignField(id, field, localVal); } if (e.key === 'Escape') { setEditing(false); setLocalVal(String(value ?? '')); } }}
            className={`w-full h-full min-h-[44px] absolute inset-0 px-3 text-xs outline-none focus:ring-inset focus:ring-2 focus:ring-brand-500/50 ${isDarkMode ? 'bg-[#1a1a24] text-white' : 'bg-white text-slate-900'}`}
          />
        ) : (
          <div
            onClick={() => setEditing(true)}
            className={`min-h-[44px] px-3 flex items-center text-xs cursor-text truncate max-w-[200px] ${
              localVal
                ? (isDarkMode ? 'text-slate-200' : 'text-slate-800')
                : (isDarkMode ? 'text-slate-700' : 'text-slate-400')
            }`}
          >
            {localVal || '—'}
          </div>
        )}
      </td>
    );
  };

  const filteredCampaigns = campaigns.filter(camp => 
    camp.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    camp.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return (
    <div className={`flex flex-col h-full animate-in fade-in duration-500 relative ${isDarkMode ? 'bg-[#030305]' : 'bg-slate-50'}`}>
      
      {/* ADD COLUMN MODAL */}
      {isAddingColumn && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`${isDarkMode ? 'bg-[#13131a] border-white/10' : 'bg-white border-slate-200'} border rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden`}>
            <div className={`p-6 border-b ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
              <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Añadir nueva columna</h3>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Ingresa el nombre para la nueva columna.</p>
            </div>
            <div className="p-6">
              <input 
                autoFocus
                value={newColumnName}
                onChange={e => setNewColumnName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newColumnName.trim()) {
                    addColumn(newColumnName.trim());
                    setIsAddingColumn(false);
                    setNewColumnName('');
                  }
                }}
                placeholder="Ej. Social Media, Prioridad..."
                className={`w-full border rounded-xl px-4 py-3 transition-all outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 ${
                  isDarkMode ? 'bg-[#0a0a0f] border-white/10 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
            <div className={`p-6 flex items-center justify-end gap-3 ${isDarkMode ? 'bg-white/[0.02] border-t border-white/5' : 'bg-slate-50 border-t border-slate-100'}`}>
              <button 
                onClick={() => { setIsAddingColumn(false); setNewColumnName(''); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isDarkMode ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (newColumnName.trim()) {
                    addColumn(newColumnName.trim());
                    setIsAddingColumn(false);
                    setNewColumnName('');
                  }
                }}
                disabled={!newColumnName.trim()}
                className="px-6 py-2 rounded-xl text-sm font-medium bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/20"
              >
                Añadir Columna
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE COLUMN MODAL */}
      {columnToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`border rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden ${isDarkMode ? 'bg-[#13131a] border-white/10' : 'bg-white border-slate-200'}`}>
            <div className={`p-6 border-b flex items-start gap-4 ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Eliminar columna</h3>
                <p className={`text-sm mt-2 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  ¿Estás seguro de que deseas eliminar la columna <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>"{columnLabels[columnToDelete] || columnToDelete}"</span>? Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className={`p-6 flex items-center justify-end gap-3 ${isDarkMode ? 'bg-white/[0.02] border-t border-white/5' : 'bg-slate-50 border-t border-slate-100'}`}>
              <button 
                onClick={() => setColumnToDelete(null)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isDarkMode ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  await deleteColumn(columnToDelete);
                  setColumnToDelete(null);
                }}
                className="px-6 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE SELECTED REGISTERS MODAL */}
      {isDeletingSelected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`border rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden ${isDarkMode ? 'bg-[#13131a] border-white/10' : 'bg-white border-slate-200'}`}>
            <div className={`p-6 border-b flex items-start gap-4 ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Eliminar registros</h3>
                <p className={`text-sm mt-2 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  ¿Estás seguro de que quieres eliminar <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedIds.length}</span> {selectedIds.length === 1 ? 'registro' : 'registros'}? Esta acción es definitiva.
                </p>
              </div>
            </div>
            <div className={`p-6 flex items-center justify-end gap-3 ${isDarkMode ? 'bg-white/[0.02] border-t border-white/5' : 'bg-slate-50 border-t border-slate-100'}`}>
              <button 
                onClick={() => setIsDeletingSelected(false)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isDarkMode ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteSelected}
                className="px-6 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute bottom-6 right-6 z-50 bg-red-500 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <Trash2 className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Secondary Navbar */}
      <div className={`h-14 border-b flex items-center justify-between px-6 backdrop-blur-md sticky top-0 z-10 ${
        isDarkMode ? 'bg-[#0a0a0f]/80 border-white/5' : 'bg-white/80 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <button className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors border ${
            isDarkMode ? 'text-white bg-white/5 hover:bg-white/10 border-white/5' : 'text-slate-900 bg-white hover:bg-slate-50 border-slate-200'
          }`}>
            <LayoutGrid className="w-4 h-4 text-brand-400" />
            Vista Principal
            <ArrowUpDown className="w-3 h-3 text-slate-500 ml-1" />
          </button>
          
          <div className="h-4 w-px bg-white/10 mx-1"></div>
          
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg text-xs font-medium transition-colors">
            <EyeOff className="w-4 h-4" /> 4 Ocultos
          </button>
          
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg text-xs font-medium transition-colors">
            <Filter className="w-4 h-4" /> Filtro
          </button>

          {selectedIds.length > 0 && (
            <div className="flex items-center animate-in slide-in-from-left-2 fade-in">
              <div className="h-4 w-px bg-white/10 mx-2"></div>
              <button 
                onClick={handleDeleteSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-500/20 transition-colors border border-red-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar {selectedIds.length}
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar campaña..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`border rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 w-64 transition-all ${
                isDarkMode 
                  ? 'bg-[#13131a] border-white/10 text-white placeholder-slate-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
          <button className={`p-1.5 rounded-lg transition-colors ${
            isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}>
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className={`flex-1 overflow-auto p-6 ${isDarkMode ? 'bg-[#0a0a0f]' : 'bg-slate-50'}`}>
        {loading ? (
          <div className="h-full flex items-center justify-center flex-col gap-4">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            <p className={`text-sm animate-pulse ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Cargando base de datos...</p>
          </div>
        ) : (
          <div className={`inline-block min-w-full rounded-xl border overflow-hidden backdrop-blur-xl shadow-2xl pb-12 ${
            isDarkMode ? 'border-white/5 bg-[#13131a]/50 ring-1 ring-white/10' : 'border-slate-200 bg-white ring-1 ring-slate-100'
          }`}>
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className={`text-[11px] uppercase tracking-wider font-semibold border-b sticky top-0 z-10 shadow-sm ${
                isDarkMode ? 'bg-[#13131a] text-slate-400 border-white/10' : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}>
                <tr>
                  <th className="w-12 p-3 text-center border-r border-white/10">
                    <input 
                      type="checkbox" 
                      onChange={(e) => setSelectedIds(e.target.checked ? filteredCampaigns.map(d => d.id) : [])}
                      checked={filteredCampaigns.length > 0 && selectedIds.length === filteredCampaigns.length}
                      className="rounded bg-black/20 border-white/20 text-brand-500 focus:ring-brand-500/50 cursor-pointer accent-brand-500" 
                    />
                  </th>
                  <EditableMainHeader field="title" isDarkMode={isDarkMode} />
                  <EditableHeader field="category" minW="140px" isDarkMode={isDarkMode} />
                  {columns.map((colId) => (
                    <EditableHeader key={colId} field={colId} onDelete={setColumnToDelete} isDarkMode={isDarkMode} />
                  ))}
                  <th className={`p-0 border-r min-w-[50px] transition-colors cursor-pointer ${
                    isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'
                  }`} onClick={() => setIsAddingColumn(true)}>
                    <div className="flex items-center justify-center w-full h-full text-brand-400">
                      <Plus className="w-4 h-4" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                {filteredCampaigns.map((row, index) => (
                  <tr 
                    key={row.id} 
                    className={cn(
                      "transition-colors group",
                      isDarkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50',
                      selectedIds.includes(row.id) && (isDarkMode ? "bg-brand-500/[0.05]" : "bg-brand-50")
                    )}
                  >
                    <td className={`p-3 text-center border-r relative ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
                      <span className="text-xs text-slate-600 group-hover:opacity-0 transition-opacity">{index + 1}</span>
                      <input 
                        type="checkbox" 
                        className={cn(
                          "rounded bg-black/50 border-white/20 text-brand-500 focus:ring-brand-500/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer accent-brand-500 transition-opacity",
                          selectedIds.includes(row.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}
                        checked={selectedIds.includes(row.id)}
                        onChange={() => toggleSelect(row.id)} 
                      />
                    </td>
                    <td className={`p-0 border-r relative group/input ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
                      <input 
                        type="text"
                        value={row.title || ''}
                        onChange={(e) => updateCampaignField(row.id, 'title', e.target.value)}
                        placeholder="Sin título"
                        className={`w-full h-full min-h-[44px] bg-transparent px-4 text-sm font-medium focus:outline-none focus:ring-inset focus:ring-2 focus:ring-brand-500/50 transition-all absolute inset-0 rounded-none ${
                          isDarkMode 
                            ? 'text-slate-200 placeholder-slate-700 focus:bg-[#1a1a24]' 
                            : 'text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                    </td>
                    <td className={`p-0 border-r relative ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
                      <select 
                        value={row.category || ''}
                        onChange={(e) => updateCampaignField(row.id, 'category', e.target.value || null)}
                        className={cn(
                          "w-full h-full min-h-[44px] bg-transparent text-xs px-3 outline-none cursor-pointer appearance-none absolute inset-0 focus:ring-inset focus:ring-2 focus:ring-brand-500/50 transition-all",
                          !row.category && (isDarkMode ? "text-slate-600 font-medium" : "text-slate-400 font-medium"),
                          isDarkMode ? "focus:bg-[#1a1a24] text-slate-200" : "focus:bg-white text-slate-900"
                        )}
                      >
                        <option value="" className={isDarkMode ? "bg-[#0a0a0f] text-slate-400" : "bg-white text-slate-500"}>Seleccionar...</option>
                        {DEFAULT_CATEGORIES.map(cat => (
                          <option key={cat} value={cat} className={isDarkMode ? "bg-[#0a0a0f] text-slate-200" : "bg-white text-slate-900"}>{cat}</option>
                        ))}
                      </select>
                      {row.category && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                           <Tag colorClass={getCategoryColor(row.category)}>{row.category.split(' ')[0]}</Tag>
                        </div>
                      )}
                    </td>
                    
                    {columns.map((colId, i) => (
                      <DataCell 
                        key={colId} 
                        id={row.id} 
                        field={colId} 
                        value={row[colId]} 
                        activeColor={COLORS[i % COLORS.length]} 
                      />
                    ))}
                    
                    <td className={`p-0 border-r ${isDarkMode ? 'border-white/5 bg-white/[0.01]' : 'border-slate-200 bg-slate-50/50'}`}></td>
                  </tr>
                ))}
                
                {filteredCampaigns.length === 0 && searchQuery !== '' ? (
                  <tr>
                    <td colSpan={columns.length + 4} className="p-8 text-center text-slate-500 text-sm">
                      No se encontraron resultados para "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={columns.length + 4} className={`p-0 border-r transition-colors ${isDarkMode ? 'border-white/5 bg-brand-500/5 hover:bg-brand-500/10' : 'border-slate-200 bg-brand-50 hover:bg-brand-100'}`}>
                      <button 
                        onClick={addCampaign}
                        className="w-full h-[44px] flex items-center justify-center gap-2 text-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors focus:outline-none"
                      >
                        <Plus className="w-5 h-5" />
                        Haz clic aquí para crear una nueva fila
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-6 px-2 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-4">
            <span className="bg-white/5 px-2.5 py-1 rounded-md border border-white/10 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Sincronizado
            </span>
            <span>{filteredCampaigns.length} registros</span>
          </div>
        </div>
      </div>
    </div>
  );
}
