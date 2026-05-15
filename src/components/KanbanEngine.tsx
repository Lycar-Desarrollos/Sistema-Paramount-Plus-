import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCampaignStore, type RecordData, type ColumnDefinition } from '../store/useCampaignStore';
import { useTheme } from '../context/ThemeContext';
import { cn, hashColor, AVATAR_COLORS } from '../lib/utils';
import { 
  Loader2, MoreHorizontal, Plus, Calendar, Clock, 
  User, CheckCircle2, X, Maximize2, 
  Settings2, LayoutPanelLeft, ArrowRightLeft,
  GripVertical, Database, Zap
} from 'lucide-react';

export default function KanbanEngine({ tableId }: { tableId: string }) {
  const { isDarkMode } = useTheme();
  const tables = useCampaignStore(state => state.tables);
  const table = tables.find(t => t.id === tableId);
  const records = useCampaignStore(state => state.records);
  const tableRecords = useMemo(() => records.filter((r: any) => r.tableId === tableId), [records, tableId]);
  const updateRecordField = useCampaignStore(state => state.updateRecordField);
  const addRecord = useCampaignStore(state => state.addRecord);
  const addColumn = useCampaignStore(state => state.addColumn);
  
  if (!table) return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#030305]">
      <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
      <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Cargando configuración del flujo...</p>
    </div>
  );
  
  // 1. Logic to find multiple possible axes for the Kanban (Select columns)
  const selectColumns = useMemo(() => {
    return table.columnDefinitions.filter(c => c.type === 'select') || [];
  }, [table]);

  const [activeAxisId, setActiveAxisId] = useState<string | null>(null);
  const [draggedRecordId, setDraggedRecordId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  // Set default axis if not set
  useEffect(() => {
    if (!activeAxisId && selectColumns.length > 0) {
      const status = selectColumns.find(c => c.id.includes('status') || c.name.toLowerCase().includes('estado'));
      setActiveAxisId(status?.id || selectColumns[0].id);
    }
  }, [selectColumns, activeAxisId]);

  const activeAxis = useMemo(() => 
    selectColumns.find(c => c.id === activeAxisId), 
    [selectColumns, activeAxisId]
  );

  const columnOptions = useMemo(() => {
    if (!activeAxis) return [];
    return activeAxis.config?.options || [];
  }, [activeAxis]);

  // 2. Group records by the chosen axis
  const groupedRecords = useMemo(() => {
    const groups: Record<string, RecordData[]> = {};
    if (!activeAxis) return groups;
    
    columnOptions.forEach(opt => {
      groups[opt.label] = tableRecords.filter((r: any) => r.values?.[activeAxis.id] === opt.label);
    });
    
    const unmatched = tableRecords.filter((r: any) => !r.values?.[activeAxis.id]);
    if (unmatched.length > 0) {
      groups['Sin Definir'] = unmatched;
    }
    return groups;
  }, [tableRecords, columnOptions, activeAxis]);

  const finalColumns = useMemo(() => {
    const list = [...columnOptions];
    if (groupedRecords['Sin Definir'] && groupedRecords['Sin Definir'].length > 0) {
      list.push({ label: 'Sin Definir', color: '#475569' });
    }
    return list;
  }, [columnOptions, groupedRecords]);

  if (selectColumns.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#030305]">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-32 h-32 rounded-[40px] bg-brand-500/10 flex items-center justify-center mb-8 rotate-3 shadow-[0_0_50px_rgba(99,102,241,0.1)]"
        >
          <Zap className="w-16 h-16 text-brand-500" />
        </motion.div>
        <h3 className={`text-3xl font-black mb-3 tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          El Flujo requiere Estructura
        </h3>
        <p className="text-base text-slate-500 max-w-sm font-medium leading-relaxed mb-8">
          Para visualizar este tablero, necesitamos una columna de <span className="text-brand-500 font-bold">"Selección"</span> que defina los estados de tu proceso.
        </p>
        <button 
          onClick={() => addColumn(tableId, 'Estado de Flujo', 'select', { options: [
            { label: 'Pendiente', color: '#6366f1' },
            { label: 'En Proceso', color: '#f59e0b' },
            { label: 'Completado', color: '#10b981' }
          ]})}
          className="px-6 py-3 bg-brand-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-600 transition-all shadow-xl shadow-brand-500/20 active:scale-95"
        >
          Crear Columna de Estado
        </button>
      </div>
    );
  }

  const handleDragStart = (e: React.DragEvent, recordId: string) => {
    setDraggedRecordId(recordId);
    e.dataTransfer.setData('recordId', recordId);
  };

  const handleDrop = (e: React.DragEvent, statusLabel: string) => {
    e.preventDefault();
    const recordId = e.dataTransfer.getData('recordId');
    if (recordId && activeAxis) {
      const finalVal = statusLabel === 'Sin Definir' ? '' : statusLabel;
      updateRecordField(recordId, activeAxis.id, finalVal);
    }
    setDraggedRecordId(null);
    setDropTarget(null);
  };

  const handleAddInColumn = (label: string) => {
    if (!activeAxis) return;
    const initialValues = {
      [activeAxis.id]: label === 'Sin Definir' ? '' : label
    };
    addRecord(tableId, initialValues);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#030305]">
      {/* Kanban Sub-Header — Axis Switcher */}
      <div className="h-16 px-8 flex items-center justify-between border-b border-white/5 bg-white/[0.02] backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <ArrowRightLeft className="w-4 h-4 text-brand-500" />
            Flujo de trabajo
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/40 border border-white/5">
            {selectColumns.map(col => (
              <button
                key={col.id}
                onClick={() => setActiveAxisId(col.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                  activeAxisId === col.id 
                    ? "bg-white text-black shadow-2xl" 
                    : "text-slate-500 hover:text-white hover:bg-white/5"
                )}
              >
                {col.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="h-8 w-px bg-white/5" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              {tableRecords.length} SOLICITUDES
            </span>
            <span className="text-[9px] font-bold text-slate-500 uppercase">
              Actualizado ahora
            </span>
          </div>
        </div>
      </div>

      {/* Kanban Horizontal View */}
      <div className="flex-1 flex gap-8 p-8 overflow-x-auto overflow-y-hidden custom-scrollbar">
        {finalColumns.map((col: any) => {
          const isTarget = dropTarget === col.label;
          const colColor = col.color || '#6366f1';
          const recordsInCol = groupedRecords[col.label] || [];
          
          return (
            <div 
              key={col.label} 
              className="flex-shrink-0 w-[340px] flex flex-col group/column"
              onDragOver={(e) => {
                e.preventDefault();
                if (dropTarget !== col.label) setDropTarget(col.label);
              }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(e) => handleDrop(e, col.label)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-6 px-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div 
                      className="w-2.5 h-2.5 rounded-full blur-[2px] absolute inset-0 animate-pulse" 
                      style={{ backgroundColor: colColor }} 
                    />
                    <div 
                      className="w-2.5 h-2.5 rounded-full relative z-10 border border-white/40 shadow-lg" 
                      style={{ backgroundColor: colColor }} 
                    />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/90">
                    {col.label}
                  </h4>
                  <div className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-slate-500">
                    {recordsInCol.length}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover/column:opacity-100 transition-all duration-300">
                  <button className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Cards Container */}
              <div className={cn(
                "flex-1 overflow-y-auto space-y-4 px-2 py-2 custom-scrollbar transition-all duration-500 rounded-[40px] border-2 border-transparent",
                isTarget ? "bg-white/[0.03] border-white/10" : "",
                draggedRecordId && !isTarget ? "opacity-40" : "opacity-100"
              )}>
                <AnimatePresence mode="popLayout">
                  {recordsInCol.map(record => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      draggable
                      onDragStart={(e: any) => handleDragStart(e, record.id)}
                      onDragEnd={() => {
                        setDraggedRecordId(null);
                        setDropTarget(null);
                      }}
                      className={cn(
                        "group relative p-6 rounded-[32px] border cursor-grab active:cursor-grabbing transition-all duration-500",
                        draggedRecordId === record.id ? "ring-2 ring-brand-500 shadow-2xl scale-[0.98] rotate-2" : "shadow-xl",
                        isDarkMode 
                          ? "bg-[#0f0f15] border-white/5 hover:border-white/20" 
                          : "bg-white border-slate-200"
                      )}
                    >
                      <div className="flex flex-col gap-5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                            {record.values?.folio || record.id.slice(-6).toUpperCase()}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                             <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" />
                          </div>
                        </div>

                        <h5 className="text-base font-black leading-[1.3] tracking-tight text-white line-clamp-3">
                          {record.values?.title || record.values?.name || 'Sin título'}
                        </h5>

                        <div className="flex flex-wrap gap-2">
                          {record.values?.type && (
                            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                              {record.values.type}
                            </span>
                          )}
                          {record.values?.priority && (
                            <span className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-[9px] font-black uppercase tracking-widest text-red-400">
                              {record.values.priority}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-5 mt-1 border-t border-white/5">
                          <div className="flex items-center gap-3">
                             <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white border border-white/10 shadow-2xl", hashColor(record.values?.email || record.id, AVATAR_COLORS))}>
                               {(record.values?.email || record.values?.nombre || 'U')[0].toUpperCase()}
                             </div>
                             <div className="flex flex-col">
                               <span className="text-[10px] font-black text-white leading-none mb-0.5">
                                 {record.values?.email?.split('@')[0] || 'Usuario'}
                               </span>
                               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                 {record.values?.date ? new Date(record.values.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) : 'Hoy'}
                               </span>
                             </div>
                          </div>
                          
                          <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-brand-500 transition-all">
                             <Maximize2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Drag Handle Glow */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-brand-500/0 group-hover:bg-brand-500/50 rounded-r-full blur-[2px] transition-all" />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Quick Add Button at the bottom */}
                <button 
                  onClick={() => handleAddInColumn(col.label)}
                  className="w-full py-6 rounded-[32px] border-2 border-dashed border-white/5 hover:border-brand-500/40 hover:bg-brand-500/[0.02] flex items-center justify-center gap-3 text-slate-600 hover:text-brand-500 transition-all group/addbtn"
                >
                  <Plus className="w-5 h-5 group-hover/addbtn:scale-125 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Añadir registro</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Add Status Column shortcut */}
        <div className="flex-shrink-0 w-80 flex items-center justify-center">
           <button 
             onClick={() => {/* Open Add Column Modal */}}
             className="w-full h-24 rounded-[40px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-2 text-slate-700 hover:text-brand-500 hover:border-brand-500/20 hover:bg-white/[0.01] transition-all"
           >
             <Plus className="w-6 h-6" />
             <span className="text-[10px] font-black uppercase tracking-widest">Añadir Etapa</span>
           </button>
        </div>
      </div>
    </div>
  );
}
