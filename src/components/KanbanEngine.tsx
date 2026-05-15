import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useCampaignStore, type RecordData, type ColumnDefinition } from '../store/useCampaignStore';
import { useTheme } from '../context/ThemeContext';
import { cn, hashColor, AVATAR_COLORS } from '../lib/utils';
import { 
  MoreHorizontal, Plus, Calendar, Clock, 
  User, CheckCircle2, X, Maximize2, 
  Settings2, LayoutPanelLeft, ArrowRightLeft,
  GripVertical, Database, Zap
} from 'lucide-react';

export default function KanbanEngine({ tableId }: { tableId: string }) {
  const { isDarkMode } = useTheme();
  const tables = useCampaignStore(state => state.tables);
  const table = tables.find(t => t.id === tableId);
  const records = useCampaignStore(state => state.records.filter((r: any) => r.tableId === tableId));
  const updateRecordField = useCampaignStore(state => state.updateRecordField);
  const addRecord = useCampaignStore(state => state.addRecord);
  
  // 1. Logic to find multiple possible axes for the Kanban (Select columns)
  const selectColumns = useMemo(() => {
    return table?.columnDefinitions.filter(c => c.type === 'select') || [];
  }, [table]);

  const [activeAxisId, setActiveAxisId] = useState<string | null>(null);
  const [draggedRecordId, setDraggedRecordId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  // Set default axis if not set
  useEffect(() => {
    if (!activeAxisId && selectColumns.length > 0) {
      const status = selectColumns.find(c => c.id === 'status' || c.name.toLowerCase().includes('estado'));
      setActiveAxisId(status?.id || selectColumns[0].id);
    }
  }, [selectColumns, activeAxisId]);

  const activeAxis = useMemo(() => 
    selectColumns.find(c => c.id === activeAxisId), 
    [selectColumns, activeAxisId]
  );

  const columns = useMemo(() => {
    if (!activeAxis) return [];
    return activeAxis.config?.options || [];
  }, [activeAxis]);

  // 2. Group records by the chosen axis
  const groupedRecords = useMemo(() => {
    const groups: Record<string, RecordData[]> = {};
    if (!activeAxis) return groups;
    
    columns.forEach(opt => {
      groups[opt.label] = records.filter((r: any) => r.values[activeAxis.id] === opt.label);
    });
    
    const unmatched = records.filter((r: any) => !r.values[activeAxis.id]);
    if (unmatched.length > 0) {
      groups['Sin Definir'] = unmatched;
    }
    return groups;
  }, [records, columns, activeAxis]);

  if (selectColumns.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-24 h-24 rounded-[40px] bg-brand-500/10 flex items-center justify-center mb-8 rotate-3">
          <Zap className="w-12 h-12 text-brand-500" />
        </div>
        <h3 className={`text-2xl font-black mb-3 tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          El Flujo requiere Estructura
        </h3>
        <p className="text-sm text-slate-500 max-w-sm font-medium leading-relaxed">
          Para ver este tablero, añade una columna de tipo <span className="text-brand-500 font-bold">"Selección"</span> a tu tabla para definir los estados de tu flujo.
        </p>
      </div>
    );
  }

  const handleDragStart = (e: React.DragEvent, recordId: string) => {
    setDraggedRecordId(recordId);
    e.dataTransfer.setData('recordId', recordId);
    // Remove default ghost image for custom feel if needed, but standard is fine
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
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Kanban Sub-Header — Axis Switcher */}
      <div className="h-14 px-8 flex items-center justify-between border-b border-white/5 bg-black/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Organizar por:
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5">
            {selectColumns.map(col => (
              <button
                key={col.id}
                onClick={() => setActiveAxisId(col.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  activeAxisId === col.id 
                    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" 
                    : "text-slate-500 hover:text-white hover:bg-white/5"
                )}
              >
                {col.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            {records.length} Registros Totales
          </span>
        </div>
      </div>

      {/* Kanban Horizontal View */}
      <div className="flex-1 flex gap-6 p-8 overflow-x-auto overflow-y-hidden custom-scrollbar bg-transparent">
        {columns.concat(groupedRecords['Sin Definir'] ? [{ label: 'Sin Definir', color: '#475569' }] : []).map((col: any) => {
          const isTarget = dropTarget === col.label;
          
          return (
            <div 
              key={col.label} 
              className="flex-shrink-0 w-80 flex flex-col"
              onDragOver={(e) => {
                e.preventDefault();
                if (dropTarget !== col.label) setDropTarget(col.label);
              }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(e) => handleDrop(e, col.label)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-5 px-3 group/col">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] border border-white/20" 
                    style={{ backgroundColor: col.color || '#6366f1' }} 
                  />
                  <h4 className={`text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {col.label}
                  </h4>
                  <div className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded-lg transition-all",
                    isDarkMode ? "bg-white/5 text-slate-500" : "bg-slate-100 text-slate-400"
                  )}>
                    {groupedRecords[col.label]?.length || 0}
                  </div>
                </div>
                <button 
                  onClick={() => handleAddInColumn(col.label)}
                  className="p-1.5 rounded-lg opacity-0 group-hover/col:opacity-100 hover:bg-brand-500/10 hover:text-brand-500 text-slate-600 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Cards Container */}
              <div className={cn(
                "flex-1 overflow-y-auto space-y-4 pr-3 custom-scrollbar transition-all duration-300 rounded-[32px] p-2 border-2 border-transparent",
                isTarget ? "bg-brand-500/[0.03] border-brand-500/20 shadow-inner" : "",
                draggedRecordId && !isTarget ? "bg-white/[0.01]" : ""
              )}>
                <AnimatePresence mode="popLayout">
                  {groupedRecords[col.label]?.map(record => (
                    <motion.div
                      key={record.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      draggable
                      onDragStart={(e: any) => handleDragStart(e, record.id)}
                      onDragEnd={() => {
                        setDraggedRecordId(null);
                        setDropTarget(null);
                      }}
                      className={cn(
                        "group relative p-5 rounded-[28px] border cursor-grab active:cursor-grabbing transition-all duration-300",
                        draggedRecordId === record.id ? "opacity-40 scale-95" : "opacity-100",
                        isDarkMode 
                          ? "bg-[#0f0f15]/80 backdrop-blur-md border-white/5 hover:border-brand-500/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] shadow-xl" 
                          : "bg-white border-slate-200 hover:border-brand-500 shadow-sm hover:shadow-2xl"
                      )}
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-xl shadow-sm",
                            isDarkMode ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"
                          )}>
                            {record.values.folio || record.id.slice(-6).toUpperCase()}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                             <button className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white">
                               <MoreHorizontal className="w-3.5 h-3.5" />
                             </button>
                          </div>
                        </div>

                        <h5 className={`text-sm font-black leading-snug tracking-tight line-clamp-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {record.values.title || record.values.name || 'Sin título'}
                        </h5>

                        <div className="flex flex-col gap-2.5">
                          {record.values.date && (
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-wider">
                              <Calendar className="w-3.5 h-3.5 opacity-40" />
                              <span>{new Date(record.values.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4 mt-1 border-t border-white/5">
                          <div className="flex items-center gap-2">
                             <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black text-white border border-white/10 shadow-lg", hashColor(record.values.email || record.id, AVATAR_COLORS))}>
                               {(record.values.email || record.values.nombre || 'U')[0].toUpperCase()}
                             </div>
                             <span className="text-[10px] font-bold text-slate-500 truncate max-w-[100px]">
                               {record.values.email?.split('@')[0] || 'Asignado'}
                             </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-white/5 text-slate-600 group-hover:text-brand-500 transition-colors">
                              <Maximize2 className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Drag Handle Icon Indicator */}
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-20 transition-all">
                        <GripVertical className="w-4 h-4" />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Visual Placeholder when dragging over empty space */}
                {(!groupedRecords[col.label] || groupedRecords[col.label].length === 0) && (
                  <div className={cn(
                    "h-32 rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all",
                    isTarget 
                      ? "border-brand-500/40 bg-brand-500/5 text-brand-500" 
                      : "border-white/5 bg-white/[0.01] text-slate-600"
                  )}>
                    <Zap className={cn("w-5 h-5", isTarget ? "animate-pulse" : "opacity-20")} />
                    <p className="text-[9px] font-black uppercase tracking-[0.2em]">Mover aquí</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
