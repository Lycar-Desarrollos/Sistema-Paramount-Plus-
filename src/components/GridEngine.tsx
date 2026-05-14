import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, Plus, LayoutGrid, EyeOff, Settings, Trash2, CheckCircle2, Edit2, Calendar, Link2, ExternalLink, User, ChevronDown, X, Loader2, Maximize2, Rows, List, Paperclip, Upload, FileText } from 'lucide-react';
import { useCampaignStore, type ColumnDefinition, type ColumnType, type RecordData } from '../store/useCampaignStore';
import { cn, hashColor, AVATAR_COLORS } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { uploadToCloudinary, getCloudinaryThumbnail } from '../services/cloudinary';

const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const DynamicCell = ({ record, column, setIsLinkingRecord }: { record: RecordData, column: ColumnDefinition, setIsLinkingRecord: any }) => {
  const { isDarkMode } = useTheme();
  const updateRecordField = useCampaignStore(state => state.updateRecordField);
  const value = record.values[column.id];
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => { setLocalVal(value); }, [value]);

  const handleUpdate = (newVal: any) => {
    if (newVal !== value) {
      updateRecordField(record.id, column.id, newVal);
    }
    setEditing(false);
  };

  // Render by type
  switch (column.type) {
    case 'checkbox': {
      return (
        <td className="p-0 border-r text-center w-[50px]">
          <button 
            onClick={() => handleUpdate(!value)}
            className={cn(
              "w-5 h-5 rounded border transition-all flex items-center justify-center mx-auto",
              value ? "bg-brand-500 border-brand-500 text-white" : "border-slate-500/30 hover:border-brand-500/50"
            )}
          >
            {value && <CheckCircle2 className="w-3.5 h-3.5" />}
          </button>
        </td>
      );
    }

    case 'select': {
      const options = column.config?.options || [];
      const selectedOption = options.find(o => o.label === value);
      return (
        <td className="p-0 border-r min-w-[150px] group/select relative">
          {editing ? (
            <div className={`absolute top-0 left-0 w-full min-w-[200px] z-[100] p-2 ${isDarkMode ? 'bg-[#1a1a24] shadow-2xl' : 'bg-white shadow-xl border border-slate-200'} rounded-xl border border-white/5`}>
              <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto custom-scrollbar">
                {options.map(opt => (
                  <button 
                    key={opt.label}
                    onClick={() => handleUpdate(opt.label)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 text-left text-xs font-bold"
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
                    {opt.label}
                  </button>
                ))}
                {options.length === 0 && <span className="p-2 text-[10px] text-slate-500">Sin opciones</span>}
              </div>
            </div>
          ) : (
            <div 
              onClick={() => setEditing(true)}
              className="px-3 min-h-[44px] flex items-center gap-2 cursor-pointer"
            >
              {selectedOption ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-white" style={{ backgroundColor: selectedOption.color }}>
                  {selectedOption.label}
                </span>
              ) : (
                <span className="text-slate-500 text-[10px] italic">Sin selección</span>
              )}
              <ChevronDown className="w-3 h-3 text-slate-500 opacity-0 group-hover/select:opacity-100 ml-auto" />
            </div>
          )}
        </td>
      );
    }

    case 'link': {
      const links = Array.isArray(value) ? value : (value ? [value] : []);
      return (
        <td className="p-0 border-r min-w-[220px] group/link relative">
          <div className="px-3 min-h-[44px] flex flex-wrap gap-1.5 py-2 items-center">
            {links.map((link: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-brand-500/10 border border-brand-500/20 rounded-lg text-[10px] font-black text-brand-500">
                <span className="truncate max-w-[80px]">{link.displayValue}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const newLinks = links.filter((_: any, i: number) => i !== idx);
                    updateRecordField(record.id, column.id, newLinks);
                  }}
                  className="hover:text-red-500"
                ><X className="w-2.5 h-2.5" /></button>
              </div>
            ))}
            {links.length === 0 && (
              <div 
                onClick={() => setIsLinkingRecord({ recordId: record.id, colId: column.id, targetTableId: column.config?.targetTableId })}
                className="flex-1 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-500 transition-all cursor-pointer h-full"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Vincular registro...</span>
              </div>
            )}
            {links.length > 0 && (
              <button 
                onClick={() => setIsLinkingRecord({ recordId: record.id, colId: column.id, targetTableId: column.config?.targetTableId })}
                className="p-1.5 rounded-lg hover:bg-brand-500/10 text-slate-500 hover:text-brand-500 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
            {links.length > 0 && (
              <button 
                onClick={() => column.config?.targetTableId && useCampaignStore.getState().setActiveTableId(column.config.targetTableId)}
                className="ml-auto p-1.5 rounded-lg hover:bg-white/5 text-slate-500 opacity-0 group-hover/link:opacity-100 transition-all"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </td>
      );
    }

    case 'date': {
      return (
        <td className="p-0 border-r min-w-[140px]">
          <div className="px-3 min-h-[44px] flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input 
              type="date"
              value={value || ''}
              onChange={(e) => handleUpdate(e.target.value)}
              className="bg-transparent text-xs font-bold outline-none border-none text-slate-400"
            />
          </div>
        </td>
      );
    }

    case 'attachment': {
      const attachments = Array.isArray(value) ? value : (value ? [value] : []);
      const [isUploading, setIsUploading] = useState(false);

      const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
          const result = await uploadToCloudinary(file, `naticbox/attachments/${record.id}`);
          const newAttachment = {
            name: result.name,
            url: result.url,
            type: result.type,
            size: result.size,
            publicId: result.publicId,
            uploadedAt: Date.now()
          };
          handleUpdate([...attachments, newAttachment]);
        } catch (error) {
          console.error('Error uploading to Cloudinary:', error);
        } finally {
          setIsUploading(false);
        }
      };

      const isImage = (file: any) =>
        file.type?.startsWith('image/') ||
        /\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i.test(file.name || '');

      return (
        <td className="p-0 border-r min-w-[200px] group/attach relative">
          <div className="px-2 min-h-[44px] flex flex-wrap gap-1.5 py-1.5 items-center">
            {attachments.map((file: any, idx: number) => (
              isImage(file) ? (
                // IMAGE THUMBNAIL
                <div key={idx} className="relative group/img flex-shrink-0">
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={getCloudinaryThumbnail(file.url, 32, 32)}
                      alt={file.name}
                      className="w-8 h-8 rounded-lg object-cover border border-white/10 hover:border-brand-500 transition-all hover:scale-110 cursor-zoom-in shadow"
                    />
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdate(attachments.filter((_: any, i: number) => i !== idx));
                    }}
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity shadow"
                  >
                    <X className="w-2 h-2" />
                  </button>
                </div>
              ) : (
                // FILE CHIP (pdf, doc, etc.)
                <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-slate-400 group/file">
                  {file.type?.includes('pdf') || file.name?.toLowerCase().endsWith('.pdf') ? (
                    <FileText className="w-3 h-3 text-red-400 flex-shrink-0" />
                  ) : (
                    <Paperclip className="w-3 h-3 flex-shrink-0" />
                  )}
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="truncate max-w-[80px] hover:text-brand-500 transition-colors">
                    {file.name}
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdate(attachments.filter((_: any, i: number) => i !== idx));
                    }}
                    className="hover:text-red-500 opacity-0 group-hover/file:opacity-100 transition-opacity"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              )
            ))}

            <label className="cursor-pointer p-1.5 rounded-lg hover:bg-brand-500/10 text-slate-500 hover:text-brand-500 transition-all flex-shrink-0">
              {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <input type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </td>
      );
    }

    case 'user': {
      const activeProjectId = useCampaignStore.getState().activeProjectId;
      const project = useCampaignStore.getState().projects.find(p => p.id === activeProjectId);
      const members = project?.memberEmails || [];
      const allUsers = useCampaignStore.getState().allUsers;
      
      // Parsear valor existente (puede ser string separado por comas o array, normalizamos a array de strings)
      let selectedEmails: string[] = [];
      if (Array.isArray(value)) {
        selectedEmails = value.map(v => String(v).toLowerCase());
      } else if (typeof value === 'string' && value.trim() !== '') {
        selectedEmails = value.split(',').map(v => v.trim().toLowerCase());
      }

      return (
        <td className="p-0 border-r min-w-[180px] group/user relative">
          {editing ? (
            <div className={`absolute top-0 left-0 w-full min-w-[240px] z-[100] p-2 ${isDarkMode ? 'bg-[#0f0f15] shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : 'bg-white shadow-2xl border border-slate-200'} rounded-2xl border border-white/5`}>
              <div className="flex flex-col gap-1 max-h-[280px] overflow-y-auto custom-scrollbar">
                <button 
                  onClick={() => handleUpdate([])}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left text-[10px] font-black uppercase tracking-widest transition-all ${
                    isDarkMode ? 'hover:bg-white/5 text-slate-500 hover:text-white' : 'hover:bg-slate-50 text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <X className="w-3 h-3" />
                  Desasignar todos
                </button>
                <div className="h-px bg-white/5 my-1" />
                {members.map(mEmail => {
                  const mMatch = allUsers.find(u => u.email.toLowerCase() === mEmail.toLowerCase());
                  const mName = mMatch?.displayName || mEmail.split('@')[0];
                  const isSelected = selectedEmails.includes(mEmail.toLowerCase());

                  return (
                    <button 
                      key={mEmail}
                      onClick={(e) => {
                        e.stopPropagation();
                        let newSelected;
                        if (isSelected) {
                          newSelected = selectedEmails.filter(e => e !== mEmail.toLowerCase());
                        } else {
                          newSelected = [...selectedEmails, mEmail.toLowerCase()];
                        }
                        handleUpdate(newSelected);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                        isSelected 
                          ? (isDarkMode ? 'bg-brand-500/20 text-white' : 'bg-brand-50 text-brand-900')
                          : (isDarkMode ? 'hover:bg-brand-500/10 hover:text-white' : 'hover:bg-slate-50')
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 ${hashColor(mEmail, AVATAR_COLORS)}`}>
                        {mName[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[11px] font-black truncate ${isSelected ? (isDarkMode ? 'text-white' : 'text-brand-900') : ''}`}>{mName}</p>
                        <p className={`text-[9px] font-bold truncate ${isSelected ? (isDarkMode ? 'text-brand-200' : 'text-brand-600') : 'text-slate-500'}`}>{mEmail}</p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(false);
                }}
                className={`w-full mt-2 py-2 text-xs font-bold rounded-xl ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
              >
                Cerrar
              </button>
            </div>
          ) : (
            <div
              onClick={() => setEditing(true)}
              className="px-3 min-h-[44px] flex items-center gap-1 overflow-x-auto custom-scrollbar"
            >
              {selectedEmails.length > 0 ? (
                selectedEmails.map((email, idx) => {
                  const match = allUsers.find(u => u.email.toLowerCase() === email);
                  const name = match?.displayName || email.split('@')[0];
                  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  return (
                    <div
                      key={idx}
                      title={email}
                      className={`h-6 rounded-full flex items-center gap-1.5 px-1.5 border border-white/5 shrink-0 ${hashColor(email, AVATAR_COLORS)}`}
                    >
                      <span className="text-[9px] font-black text-white ml-0.5">{initials}</span>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center gap-2 opacity-0 group-hover/user:opacity-100 transition-opacity">
                  <div className="w-6 h-6 rounded-full border border-dashed border-slate-600 flex items-center justify-center text-slate-500">
                    <Plus className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] font-black text-slate-500">Asignar</span>
                </div>
              )}
            </div>
          )}
        </td>
      );
    }

    default: // text or unknown
      return (
        <td className="p-0 border-r min-w-[200px] relative group/cell">
          {editing ? (
            <input
              autoFocus
              value={localVal || ''}
              onChange={e => setLocalVal(e.target.value)}
              onBlur={() => handleUpdate(localVal)}
              onKeyDown={e => e.key === 'Enter' && handleUpdate(localVal)}
              className={`w-full h-full min-h-[44px] absolute inset-0 px-3 text-xs font-bold outline-none border-none ${isDarkMode ? 'bg-brand-500/10 text-white' : 'bg-white text-slate-900 shadow-inner'}`}
            />
          ) : (
            <div
              onClick={() => setEditing(true)}
              className="px-3 min-h-[44px] flex items-center text-xs font-bold truncate max-w-[300px]"
            >
              {value || <span className="text-slate-700 italic font-normal">Pulsa para editar</span>}
            </div>
          )}
        </td>
      );
  }
};

const HeaderCell = ({ column, setEditingColumn }: { column: ColumnDefinition, setEditingColumn: any }) => {
  const { isDarkMode } = useTheme();
  const deleteColumn = useCampaignStore(state => state.deleteColumn);
  const activeTableId = useCampaignStore(state => state.activeTableId);

  const getIcon = () => {
    switch (column.type) {
      case 'checkbox': return <CheckCircle2 className="w-3 h-3" />;
      case 'date': return <Calendar className="w-3 h-3" />;
      case 'link': return <Link2 className="w-3 h-3" />;
      case 'select': return <LayoutGrid className="w-3 h-3" />;
      case 'user': return <User className="w-3 h-3" />;
      case 'attachment': return <Paperclip className="w-3 h-3" />;
      default: return <span className="text-[10px] font-mono">Aa</span>;
    }
  };

  return (
    <th className={cn(
      "p-0 border-r min-w-[150px] group transition-colors relative h-[44px]",
      isDarkMode ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50"
    )}>
      <div className="px-4 flex items-center gap-2.5 text-slate-400 group-hover:text-white transition-colors">
        <span className="opacity-50">{getIcon()}</span>
        <span className="text-[11px] font-black uppercase tracking-widest truncate">{column.name}</span>
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button 
            onClick={() => setEditingColumn(column)}
            className="p-1 hover:text-brand-500 transition-all"
          >
            <Settings className="w-3 h-3" />
          </button>
          <button 
            onClick={() => activeTableId && deleteColumn(activeTableId, column.id)}
            className="p-1 hover:text-red-500 transition-all"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </th>
  );
};

export default function GridEngine() {
  const { isDarkMode } = useTheme();
  const { userData } = useAuth();
  const { 
    records, columnDefinitions, loading, error, initializeTableData,
    activeProjectId, activeTableId, addRecord, addColumn, deleteRecords
  } = useCampaignStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<ColumnType>('text');
  
  // Advanced Column State
  const [newColOptions, setNewColOptions] = useState<{label: string, color: string}[]>([]);
  const [targetTableId, setTargetTableId] = useState('');
  const [isLinkingRecord, setIsLinkingRecord] = useState<{recordId: string, colId: string, targetTableId?: string} | null>(null);
  const [targetRecords, setTargetRecords] = useState<RecordData[]>([]);
  const [isFetchingTarget, setIsFetchingTarget] = useState(false);
  const [editingColumn, setEditingColumn] = useState<ColumnDefinition | null>(null);
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  const [detailRecord, setDetailRecord] = useState<RecordData | null>(null);
  
  const tables = useCampaignStore(state => state.tables);
  const activeTable = tables.find(t => t.id === activeTableId);

  useEffect(() => {
    if (activeTableId) {
      const unsub = initializeTableData(activeTableId);
      return unsub;
    }
  }, [activeTableId, initializeTableData]);

  if (!activeTable && !loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 text-slate-500">
        <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
          <LayoutGrid className="w-8 h-8 opacity-20" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Selecciona una tabla</h3>
        <p className="text-sm max-w-xs text-center opacity-50">Elige una tabla de la barra lateral o crea una nueva para empezar a gestionar tus datos.</p>
      </div>
    );
  }

  useEffect(() => {
    if (isLinkingRecord?.targetTableId) {
      console.log('Fetching records for target table:', isLinkingRecord.targetTableId);
      setIsFetchingTarget(true);
      useCampaignStore.getState().fetchRecordsByTableId(isLinkingRecord.targetTableId).then(recs => {
        console.log('Fetched records:', recs.length);
        setTargetRecords(recs);
        setIsFetchingTarget(false);
      });
    } else if (isLinkingRecord) {
      console.warn('No targetTableId found for column linking');
      setTargetRecords([]);
    }
  }, [isLinkingRecord]);

  const filteredRecords = records.filter(rec => {
    if (!rec || !rec.values) return false;

    const values = Object.values(rec.values).map(v => 
      typeof v === 'object' ? JSON.stringify(v) : String(v)
    ).join(' ').toLowerCase();
    return values.includes(searchQuery.toLowerCase());
  });

  // Grouping Logic
  const groupedData = useMemo(() => {
    if (!groupBy) return { 'Sin Agrupar': filteredRecords };
    
    const groups: Record<string, RecordData[]> = {};
    filteredRecords.forEach(rec => {
      const val = rec.values[groupBy];
      let groupKey = 'Sin valor';
      
      if (val) {
        if (Array.isArray(val)) {
          groupKey = val.map(v => v.displayValue || v).join(', ');
        } else if (typeof val === 'object' && val.displayValue) {
          groupKey = val.displayValue;
        } else {
          groupKey = String(val);
        }
      }
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(rec);
    });
    return groups;
  }, [filteredRecords, groupBy]);

  const filteredTargetRecords = useMemo(() => {
    if (!isLinkingRecord) return [];
    return targetRecords.filter(rec => {
      if (!rec.values) return false;
      
      // Search filter
      const matchesSearch = JSON.stringify(rec.values).toLowerCase().includes(linkSearchQuery.toLowerCase());
      if (!matchesSearch) return false;

      return true;
    });
  }, [targetRecords, linkSearchQuery, userData, isLinkingRecord, tables]);

  if (loading && records.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col flex-1 h-full relative overflow-hidden ${isDarkMode ? 'bg-[#030305]' : 'bg-slate-50'}`}>
      
      {/* Toolbar */}
      <div className={`h-14 border-b flex items-center justify-between px-6 backdrop-blur-md sticky top-0 z-20 ${
        isDarkMode ? 'bg-[#0a0a0f]/80 border-white/5' : 'bg-white/80 border-slate-200'
      }`}>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
            <input 
              type="text"
              placeholder="Buscar en esta tabla..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`pl-10 pr-4 py-2 text-xs font-bold rounded-xl border outline-none transition-all w-[240px] ${
                isDarkMode ? 'bg-white/5 border-white/5 focus:border-brand-500' : 'bg-slate-100 border-transparent focus:bg-white focus:border-brand-500'
              }`}
            />
          </div>
          
          {/* Botón COPIAR LINK movido a la pestaña de cada tabla en App.tsx */}

          <button 
            onClick={() => {
              if (!activeTableId) return;
              const initialValues: Record<string, any> = {};
              if (userData && userData.role !== 'admin') {
                const userCol = (columnDefinitions || []).find(c => c.type === 'user');
                if (userCol) initialValues[userCol.id] = userData.email;
              }
              addRecord(activeTableId, initialValues);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-brand-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            NUEVO REGISTRO
          </button>

          <div className="flex items-center gap-1 border-l border-white/5 pl-4 ml-2">
            <div className="relative group/menu">
              <button 
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all",
                  groupBy ? "bg-brand-500/10 text-brand-500" : "text-slate-500 hover:bg-white/5 hover:text-white"
                )}
              >
                <Rows className="w-4 h-4" />
                <span>{groupBy ? `Agrupado por ${(columnDefinitions || []).find(c => c.id === groupBy)?.name}` : 'Agrupar'}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              
              <div className="absolute top-full left-0 mt-2 w-48 py-2 rounded-2xl shadow-2xl border border-white/10 bg-[#0a0a0f] opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-50">
                <button 
                  onClick={() => setGroupBy(null)}
                  className="w-full px-4 py-2 text-left text-xs font-bold text-slate-500 hover:bg-white/5 hover:text-white"
                >
                  Desactivar grupos
                </button>
                <div className="h-px bg-white/5 my-1" />
                {(columnDefinitions || []).map(col => (
                  <button 
                    key={col.id}
                    onClick={() => setGroupBy(col.id)}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-white hover:bg-white/5 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                    {col.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button 
              onClick={() => {
                deleteRecords(selectedIds);
                setSelectedIds([]);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar {selectedIds.length}
            </button>
          )}
          <button className="p-2.5 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <thead className={`sticky top-0 z-10 ${isDarkMode ? 'bg-[#0f0f13]' : 'bg-slate-50'}`}>
            <tr className={`border-b ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
              <th className="w-[40px] border-r p-0 min-w-[40px]">
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 rounded border border-slate-500/30" />
                </div>
              </th>
              {(columnDefinitions || []).map(col => (
                <HeaderCell key={col.id} column={col} setEditingColumn={setEditingColumn} />
              ))}
              <th className="p-0 min-w-[120px]">
                <button 
                  onClick={() => setIsAddingCol(true)}
                  className="w-full h-[44px] flex items-center justify-center gap-2 text-slate-500 hover:text-brand-500 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Columna</span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedData).map(([groupKey, groupRecords]) => (
              <React.Fragment key={groupKey}>
                {groupBy && (
                  <tr className={`sticky top-[44px] z-[5] ${isDarkMode ? 'bg-[#0f0f13]' : 'bg-slate-50 shadow-sm'}`}>
                    <td colSpan={columnDefinitions.length + 2} className={`px-4 py-3 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                      <button 
                        onClick={() => {
                          if (collapsedGroups.includes(groupKey)) setCollapsedGroups(collapsedGroups.filter(g => g !== groupKey));
                          else setCollapsedGroups([...collapsedGroups, groupKey]);
                        }}
                        className="flex items-center gap-3 text-[10px] font-black text-slate-500 hover:text-white transition-all group/gbtn"
                      >
                        <div className={cn("w-5 h-5 rounded-lg flex items-center justify-center transition-all", 
                          isDarkMode ? "bg-white/5 group-hover/gbtn:bg-white/10" : "bg-white shadow-sm"
                        )}>
                          <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", collapsedGroups.includes(groupKey) && "-rotate-90")} />
                        </div>
                        <span className="uppercase tracking-widest flex items-center gap-2">
                          {groupBy === 'user' ? 'Colaborador:' : ''} {groupKey}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${isDarkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                          {groupRecords.length} REGISTROS
                        </span>
                      </button>
                    </td>
                  </tr>
                )}
                {!collapsedGroups.includes(groupKey) && (
                  <>
                    <AnimatePresence>
                      {groupRecords.map((rec) => (
                        <motion.tr 
                          key={rec.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`border-b transition-colors group ${
                            isDarkMode ? 'border-white/5 hover:bg-white/[0.02]' : 'border-slate-100 hover:bg-slate-50'
                          }`}
                        >
                          <td className="w-[40px] border-r p-0 text-center">
                            <div className="flex items-center justify-center gap-1 group/row">
                              <input 
                                type="checkbox"
                                checked={selectedIds.includes(rec.id)}
                                onChange={() => {
                                  if (selectedIds.includes(rec.id)) setSelectedIds(selectedIds.filter(i => i !== rec.id));
                                  else setSelectedIds([...selectedIds, rec.id]);
                                }}
                                className="accent-brand-500 group-hover/row:hidden"
                              />
                              <button
                                onClick={() => setDetailRecord(rec)}
                                className="hidden group-hover/row:flex items-center justify-center w-5 h-5 rounded-md hover:bg-brand-500/20 text-slate-500 hover:text-brand-400 transition-all"
                                title="Ver detalle"
                              >
                                <Maximize2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          {(columnDefinitions || []).map(col => (
                            <DynamicCell key={col.id} record={rec} column={col} setIsLinkingRecord={setIsLinkingRecord} />
                          ))}
                          <td className="p-0 border-r" />
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                    
                    {/* Add row per group if grouped, or at bottom if not */}
                    {groupBy && (
                      <tr 
                        onClick={() => {
                          if (!activeTableId) return;
                          const initialValues: Record<string, any> = groupBy ? { [groupBy]: groupKey } : {};
                          if (userData && userData.role !== 'admin') {
                            const userCol = (columnDefinitions || []).find(c => c.type === 'user');
                            if (userCol) initialValues[userCol.id] = userData.email;
                          }
                          addRecord(activeTableId, initialValues);
                        }}
                        className={`transition-colors cursor-pointer ${isDarkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-100/50'}`}
                      >
                        <td className="border-r p-0" />
                        <td colSpan={columnDefinitions.length + 1} className="px-4 py-3">
                          <div className="flex items-center gap-3 text-[10px] font-black text-slate-600 hover:text-brand-500 transition-colors uppercase tracking-widest">
                            <Plus className="w-3.5 h-3.5" />
                            <span>Añadir registro a "{groupKey}"</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </React.Fragment>
            ))}

            {/* Global add row at the very bottom if not grouped */}
            {!groupBy && filteredRecords.length > 0 && (
              <tr 
                onClick={() => {
                  if (!activeTableId) return;
                  const initialValues: Record<string, any> = {};
                  if (userData && userData.role !== 'admin') {
                    const userCol = (columnDefinitions || []).find(c => c.type === 'user');
                    if (userCol) initialValues[userCol.id] = userData.email;
                  }
                  addRecord(activeTableId, initialValues);
                }}
                className={`transition-colors cursor-pointer border-b ${isDarkMode ? 'hover:bg-white/[0.03] border-white/5' : 'hover:bg-slate-100/50 border-slate-100'}`}
              >
                <td className="border-r p-0 h-[44px]" />
                <td colSpan={columnDefinitions.length + 1} className="px-4 py-3">
                  <div className="flex items-center gap-3 text-[10px] font-black text-slate-600 hover:text-brand-500 transition-colors uppercase tracking-widest">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Haga clic para añadir una nueva fila</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {filteredRecords.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <LayoutGrid className="w-12 h-12 text-slate-700 opacity-20" />
            <p className="text-slate-500 text-sm font-medium">No hay registros en esta vista.</p>
            <button 
              onClick={() => {
                if (!activeTableId) return;
                const initialValues: Record<string, any> = {};
                if (userData && userData.role !== 'admin') {
                  const userCol = (columnDefinitions || []).find(c => c.type === 'user');
                  if (userCol) initialValues[userCol.id] = userData.email;
                }
                addRecord(activeTableId, initialValues);
              }}
              className="text-brand-500 text-xs font-bold hover:underline"
            >
              Crear el primer registro
            </button>
          </div>
        )}
      </div>

      {/* ── RECORD DETAIL MODAL ── */}
      <AnimatePresence>
        {detailRecord && (() => {
          const cols = columnDefinitions || [];
          const allUsers = useCampaignStore.getState().allUsers;
          return (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setDetailRecord(null)}
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.94, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={`relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl overflow-hidden border shadow-2xl ${
                  isDarkMode ? 'bg-[#0f0f15] border-white/10' : 'bg-white border-slate-200'
                }`}
              >
                {/* Header */}
                <div className={`flex items-center justify-between px-8 py-6 border-b ${
                  isDarkMode ? 'border-white/5' : 'border-slate-100'
                }`}>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">{activeTable?.name}</p>
                    <h2 className={`text-xl font-black tracking-tight ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                      {(() => {
                        const firstText = cols.find(c => c.type === 'text');
                        const val = firstText ? detailRecord.values?.[firstText.id] : null;
                        return val ? String(val) : 'Registro';
                      })()}
                    </h2>
                  </div>
                  <button
                    onClick={() => setDetailRecord(null)}
                    className={`p-2.5 rounded-xl transition-all ${
                      isDarkMode ? 'hover:bg-white/5 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                  {cols.filter(c => c.type !== 'link').map(col => {
                    const val = detailRecord.values?.[col.id];
                    if (val === undefined || val === null || val === '') return null;

                    return (
                      <div key={col.id} className={`flex flex-col gap-2 pb-5 border-b last:border-0 ${
                        isDarkMode ? 'border-white/5' : 'border-slate-100'
                      }`}>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                          {col.name}
                        </p>

                        {/* TEXT / NUMBER / DATE / EMAIL / PHONE */}
                        {['text','number','date','email','phone'].includes(col.type) && (
                          <p className={`text-sm font-semibold ${
                            isDarkMode ? 'text-white' : 'text-slate-900'
                          }`}>{String(val)}</p>
                        )}

                        {/* SELECT badge */}
                        {col.type === 'select' && (() => {
                          const opt = (col.config?.options || []).find((o: any) => o.label === val);
                          return (
                            <span
                              className="inline-flex self-start px-3 py-1 rounded-xl text-xs font-black"
                              style={{
                                backgroundColor: opt?.color ? `${opt.color}25` : '#6366f125',
                                color: opt?.color || '#6366f1',
                                border: `1px solid ${opt?.color ? `${opt.color}40` : '#6366f140'}`,
                              }}
                            >
                              {String(val)}
                            </span>
                          );
                        })()}

                        {/* CHECKBOX */}
                        {col.type === 'checkbox' && (
                          <div className={`flex items-center gap-2 text-sm font-semibold ${
                            val ? 'text-emerald-500' : isDarkMode ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                              val ? 'bg-emerald-500 border-emerald-500' : isDarkMode ? 'border-white/20' : 'border-slate-300'
                            }`}>
                              {val && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                            {val ? 'Sí' : 'No'}
                          </div>
                        )}

                        {/* USER */}
                        {col.type === 'user' && (() => {
                          const emails: string[] = Array.isArray(val) ? val : [String(val)];
                          return (
                            <div className="flex flex-wrap gap-2">
                              {emails.map(email => {
                                const u = allUsers.find((u: any) => u.email?.toLowerCase() === email.toLowerCase()) as any;
                                return (
                                  <div key={email} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-500/10 border border-brand-500/20">
                                    {u?.photoURL ? (
                                      <img src={u.photoURL} alt="" className="w-5 h-5 rounded-full object-cover" />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center text-[10px] font-black text-white">
                                        {email.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <span className="text-xs font-bold text-brand-400">
                                      {u?.displayName || email.split('@')[0]}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}

                        {/* ATTACHMENT */}
                        {col.type === 'attachment' && Array.isArray(val) && (
                          <div className="flex flex-wrap gap-3">
                            {val.map((file: any, idx: number) => {
                              const isImg = file.type?.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(file.name || '');
                              return isImg ? (
                                <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer"
                                  className="block w-24 h-24 rounded-2xl overflow-hidden border border-white/10 hover:border-brand-500 transition-all shadow-lg hover:scale-105">
                                  <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                </a>
                              ) : (
                                <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer"
                                  className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-xs font-bold transition-all hover:border-brand-500 ${
                                    isDarkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                                  }`}>
                                  <FileText className="w-4 h-4 text-red-400" />
                                  {file.name || 'Archivo'}
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className={`px-8 py-4 border-t flex items-center justify-between ${
                  isDarkMode ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'
                }`}>
                  <p className="text-[10px] font-mono text-slate-500">ID: {detailRecord.id?.slice(-10)}</p>
                  <p className="text-[10px] text-slate-500">
                    {detailRecord.createdAt ? new Date(detailRecord.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                  </p>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Footer Info */}
      <div className={`h-8 border-t px-4 flex items-center justify-between text-[10px] font-bold text-slate-500 ${isDarkMode ? 'bg-[#0a0a0f] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Sincronizado con Firestore
          </span>
          <span>{filteredRecords.length} registros</span>
        </div>
        <div>
          Workspace ID: {activeProjectId}
        </div>
      </div>
      {/* Record Picker Modal for Links */}
      <AnimatePresence>
        {isLinkingRecord && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLinkingRecord(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className={`relative w-full max-w-2xl rounded-3xl overflow-hidden border ${isDarkMode ? 'bg-[#0f0f15] border-white/10' : 'bg-white border-slate-200 shadow-2xl'}`}>
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter">Vincular Registro</h3>
                  <p className="text-xs text-slate-500">
                    {isLinkingRecord.targetTableId 
                      ? <>Tabla destino: <span className="text-brand-500 font-bold">{tables.find(t => t.id === isLinkingRecord.targetTableId)?.name || 'Desconocida'}</span></>
                      : <span className="text-red-500 font-bold">Error: Esta columna no tiene una tabla destino configurada.</span>
                    }
                  </p>
                </div>
                <button onClick={() => setIsLinkingRecord(null)} className="p-2 rounded-xl hover:bg-white/5 text-slate-500"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="px-6 py-4 border-b border-white/5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text"
                    placeholder="Buscar registro..."
                    value={linkSearchQuery}
                    onChange={e => setLinkSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold outline-none border transition-all ${isDarkMode ? 'bg-white/5 border-white/5 focus:border-brand-500' : 'bg-slate-100 border-transparent focus:bg-white focus:border-brand-500'}`}
                  />
                </div>
              </div>

              <div className="p-6 max-h-[400px] overflow-y-auto space-y-2 custom-scrollbar">
                {isFetchingTarget ? (
                  <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
                ) : (
                  <>
                    <button 
                      onClick={async () => {
                        if (isLinkingRecord.targetTableId) {
                          const initialValues: Record<string, any> = {};
                          if (userData && userData.role !== 'admin') {
                            const targetTable = tables.find(t => t.id === isLinkingRecord.targetTableId);
                            const userCol = (targetTable?.columnDefinitions || []).find(c => c.type === 'user');
                            if (userCol) initialValues[userCol.id] = userData.email;
                          }
                          await useCampaignStore.getState().addRecord(isLinkingRecord.targetTableId, initialValues);
                          // Refresh target records
                          const recs = await useCampaignStore.getState().fetchRecordsByTableId(isLinkingRecord.targetTableId);
                          setTargetRecords(recs);
                        }
                      }}
                      className="w-full p-4 mb-4 rounded-2xl border border-dashed border-brand-500/30 text-brand-500 text-xs font-black hover:bg-brand-500/5 transition-all"
                    >
                      + CREAR NUEVO REGISTRO EN ESTA TABLA
                    </button>
                    
                    <div className="space-y-2">
                      {filteredTargetRecords.map(rec => {
                          if (!rec.values) return null;
                          const displayVal = rec.values.title || Object.values(rec.values).find(v => typeof v === 'string' && v.length > 0) || 'Registro sin título';
                          return (
                            <button 
                              key={rec.id}
                              onClick={() => {
                                const sourceRecord = useCampaignStore.getState().records.find(r => r.id === isLinkingRecord.recordId);
                                if (!sourceRecord) return;

                                const currentLinks = Array.isArray(sourceRecord.values[isLinkingRecord.colId]) ? sourceRecord.values[isLinkingRecord.colId] : [];
                                if (!currentLinks.find((l: any) => l.id === rec.id)) {
                                  useCampaignStore.getState().updateRecordField(isLinkingRecord.recordId, isLinkingRecord.colId, [
                                    ...currentLinks,
                                    { id: rec.id, displayValue: displayVal }
                                  ]);
                                }
                                setIsLinkingRecord(null);
                                setLinkSearchQuery('');
                              }}
                              className={`w-full p-5 rounded-[24px] border text-left transition-all ${isDarkMode ? 'bg-white/[0.03] border-white/5 hover:border-brand-500 hover:bg-brand-500/10' : 'bg-slate-50 border-slate-200 hover:border-brand-500'}`}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center text-brand-500 font-black text-lg shadow-inner">{initials(String(displayVal))}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-black text-white truncate">{String(displayVal)}</div>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {Object.entries(rec.values).slice(0, 3).map(([k, v]) => (
                                      k !== 'title' && typeof v === 'string' && v.length > 0 && (
                                        <span key={k} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500 font-bold truncate max-w-[100px]">
                                          {v}
                                        </span>
                                      )
                                    ))}
                                    <span className="text-[9px] text-slate-600 font-mono uppercase tracking-widest">{rec.id.slice(-6)}</span>
                                  </div>
                                </div>
                                <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-brand-500">
                                  <Plus className="w-4 h-4" />
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      {targetRecords.filter(r => JSON.stringify(r.values).toLowerCase().includes(linkSearchQuery.toLowerCase())).length === 0 && (
                        <div className="text-center p-10 text-slate-500 text-sm italic">No se encontraron registros que coincidan.</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Column Modal Overlay - ENHANCED */}
      <AnimatePresence>
        {isAddingCol && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAddingCol(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className={`relative w-full max-w-md rounded-[32px] p-8 shadow-2xl border ${isDarkMode ? 'bg-[#1a1a23] border-white/10' : 'bg-white border-slate-200'}`}
            >
              <h3 className={`text-xl font-black mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>NUEVA COLUMNA</h3>
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Nombre</label>
                  <input 
                    autoFocus
                    value={newColName}
                    onChange={e => setNewColName(e.target.value)}
                    placeholder="Ej. Estatus, Prioridad..."
                    className={`w-full px-4 py-3.5 rounded-2xl text-xs font-bold border outline-none transition-all ${isDarkMode ? 'bg-black border-white/10 focus:border-brand-500' : 'bg-slate-50 border-slate-200 focus:border-brand-500'}`}
                  />
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Tipo de dato</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['text', 'select', 'date', 'checkbox', 'link', 'user', 'attachment'] as ColumnType[]).map(t => (
                      <button 
                        key={t}
                        onClick={() => {
                          setNewColType(t);
                          if (t === 'select') {
                            setNewColOptions([
                              {label: 'En proceso', color: '#3b82f6'},
                              {label: 'Pausado', color: '#f59e0b'},
                              {label: 'Terminado', color: '#10b981'}
                            ]);
                          }
                        }}
                        className={cn(
                          "px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all",
                          newColType === t 
                            ? "bg-brand-500 border-brand-500 text-white shadow-lg" 
                            : isDarkMode ? "border-white/5 text-slate-500 hover:border-brand-500/30" : "border-slate-200 text-slate-500 hover:border-brand-500/30"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {newColType === 'select' && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Configurar Estados</label>
                    <div className="space-y-2">
                      {newColOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{backgroundColor: opt.color}} />
                          <input 
                            value={opt.label}
                            onChange={(e) => {
                              const newOpts = [...newColOptions];
                              newOpts[idx].label = e.target.value;
                              setNewColOptions(newOpts);
                            }}
                            className="bg-transparent text-[11px] font-bold text-white outline-none flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {newColType === 'link' && (
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Tabla Destino</label>
                    <select 
                      value={targetTableId}
                      onChange={e => setTargetTableId(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl text-xs font-bold border outline-none ${isDarkMode ? 'bg-black border-white/10' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <option value="">Selecciona una tabla...</option>
                      {tables.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button onClick={() => setIsAddingCol(false)} className="flex-1 py-3.5 text-xs font-black text-slate-500 hover:text-white transition-colors">CANCELAR</button>
                  <button 
                    onClick={() => {
                      if (newColName && activeTableId) {
                        const config = newColType === 'select' ? { options: newColOptions } : 
                                      newColType === 'link' ? { targetTableId } : {};
                        addColumn(activeTableId, newColName, newColType, config);
                        setIsAddingCol(false);
                        setNewColName('');
                      }
                    }}
                    className="flex-1 py-3.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-black rounded-2xl transition-all shadow-xl active:scale-95"
                  >
                    CREAR COLUMNA
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Column Modal */}
      <AnimatePresence>
        {editingColumn && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingColumn(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`relative w-full max-w-sm rounded-[32px] p-8 shadow-2xl border ${isDarkMode ? 'bg-[#1a1a23] border-white/10' : 'bg-white border-slate-200'}`}>
              <h3 className={`text-xl font-black mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>EDITAR COLUMNA</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400">Nombre de la columna</label>
                  <input
                    value={editingColumn.name}
                    onChange={(e) => setEditingColumn({ ...editingColumn, name: e.target.value })}
                    className={`w-full p-3 rounded-xl text-sm font-bold border outline-none transition-all ${isDarkMode ? 'bg-white/5 border-white/10 focus:border-brand-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-brand-500 text-slate-900'}`}
                  />
                </div>
                
                {editingColumn.type === 'select' && (
                  <div className="space-y-2 mt-4">
                    <label className="text-xs font-bold text-slate-400">Opciones de Selección</label>
                    {(editingColumn.config?.options || []).map((opt: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                        <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
                        <input 
                          value={opt.label}
                          onChange={(e) => {
                            const newOpts = [...(editingColumn.config?.options || [])];
                            newOpts[idx].label = e.target.value;
                            setEditingColumn({ ...editingColumn, config: { ...editingColumn.config, options: newOpts } });
                          }}
                          className="bg-transparent text-xs font-bold text-white outline-none flex-1"
                        />
                        <button 
                          onClick={() => {
                            const newOpts = (editingColumn.config?.options || []).filter((_: any, i: number) => i !== idx);
                            setEditingColumn({ ...editingColumn, config: { ...editingColumn.config, options: newOpts } });
                          }}
                          className="text-red-500 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const newOpts = [...(editingColumn.config?.options || []), { label: 'Nueva Opción', color: '#6366f1' }];
                        setEditingColumn({ ...editingColumn, config: { ...editingColumn.config, options: newOpts } });
                      }}
                      className="w-full mt-2 py-2 border border-dashed border-slate-700 rounded-xl text-[10px] font-black text-slate-500 hover:text-white"
                    >
                      + AÑADIR OPCIÓN
                    </button>
                  </div>
                )}
                
                <div className="pt-4 flex gap-3">
                  <button onClick={() => setEditingColumn(null)} className="flex-1 py-3.5 text-xs font-black text-slate-500">CANCELAR</button>
                  <button 
                    onClick={() => {
                      if (activeTableId) {
                        useCampaignStore.getState().updateColumn(activeTableId, editingColumn.id, { 
                          name: editingColumn.name,
                          config: editingColumn.config 
                        });
                        setEditingColumn(null);
                      }
                    }}
                    className="flex-1 py-3.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-black rounded-2xl shadow-xl"
                  >
                    GUARDAR
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
