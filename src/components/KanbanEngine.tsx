import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCampaignStore, type RecordData, type ColumnDefinition } from '../store/useCampaignStore';
import { useTheme } from '../context/ThemeContext';
import { cn, hashColor, AVATAR_COLORS } from '../lib/utils';
import { MoreHorizontal, Plus, Calendar, Clock, User, CheckCircle2, X, Maximize2 } from 'lucide-react';

interface KanbanEngineProps {
  tableId: string;
}

export default function KanbanEngine({ tableId }: KanbanEngineProps) {
  const { isDarkMode } = useTheme();
  const tables = useCampaignStore(state => state.tables);
  const table = tables.find(t => t.id === tableId);
  const records = useCampaignStore(state => state.records.filter((r: any) => r.tableId === tableId));
  const updateRecordField = useCampaignStore(state => state.updateRecordField);
  const setDetailRecord = useCampaignStore(state => state.setDetailRecord);
  
  const [draggedRecordId, setDraggedRecordId] = useState<string | null>(null);

  // 1. Find the "Status" or "Select" column to group by
  const statusCol = useMemo(() => {
    return table?.columnDefinitions.find(c => c.type === 'select' || c.id === 'status' || c.name.toLowerCase() === 'estado');
  }, [table]);

  const columns = useMemo(() => {
    if (!statusCol) return [];
    return statusCol.config?.options || [];
  }, [statusCol]);

  // 2. Group records by status
  const groupedRecords = useMemo(() => {
    const groups: Record<string, RecordData[]> = {};
    if (!statusCol) return groups;
    
    columns.forEach(opt => {
      groups[opt.label] = records.filter((r: any) => r.values[statusCol.id] === opt.label);
    });
    // Also include "Sin Estado" if needed
    const unmatched = records.filter((r: any) => !r.values[statusCol.id]);
    if (unmatched.length > 0) {
      groups['Sin Estado'] = unmatched;
    }
    return groups;
  }, [records, columns, statusCol]);

  // Try to find helper columns for card UI
  const titleCol = useMemo(() => table?.columnDefinitions.find(c => c.id === 'title' || c.id === 'name' || c.name.toLowerCase().includes('título')), [table]);
  const dateCol = useMemo(() => table?.columnDefinitions.find(c => c.type === 'date'), [table]);
  const userCol = useMemo(() => table?.columnDefinitions.find(c => c.type === 'user' || c.type === 'email'), [table]);
  const priorityCol = useMemo(() => table?.columnDefinitions.find(c => c.name.toLowerCase().includes('prioridad') || c.id.toLowerCase().includes('priority')), [table]);


  if (!statusCol) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-20 h-20 rounded-3xl bg-brand-500/10 flex items-center justify-center mb-6">
          <MoreHorizontal className="w-10 h-10 text-brand-500" />
        </div>
        <h3 className={`text-xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>No se encontró columna de Estado</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          Para activar el tablero de Flujos, asegúrate de tener una columna de tipo "Selección" para gestionar los estados.
        </p>
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
    if (recordId) {
      updateRecordField(recordId, statusCol.id, statusLabel === 'Sin Estado' ? '' : statusLabel);
    }
    setDraggedRecordId(null);
  };

  return (
    <div className="flex-1 flex gap-6 p-8 overflow-x-auto overflow-y-hidden custom-scrollbar">
      {columns.concat(groupedRecords['Sin Estado'] ? [{ label: 'Sin Estado', color: '#94a3b8' }] : []).map((col: any) => (
        <div 
          key={col.label} 
          className="flex-shrink-0 w-80 flex flex-col"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, col.label)}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-3">
              <div 
                className="w-2.5 h-2.5 rounded-full shadow-sm" 
                style={{ backgroundColor: col.color || '#6366f1' }} 
              />
              <h4 className={`text-xs font-black uppercase tracking-[0.15em] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {col.label}
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                {groupedRecords[col.label]?.length || 0}
              </span>
            </div>
            <button className={`p-1 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/5 text-slate-600' : 'hover:bg-slate-100 text-slate-400'}`}>
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cards Container */}
          <div className={cn(
            "flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar transition-colors rounded-2xl p-2",
            draggedRecordId ? (isDarkMode ? 'bg-white/[0.02]' : 'bg-slate-50/50') : ''
          )}>
            <AnimatePresence>
              {groupedRecords[col.label]?.map(record => (
                <motion.div
                  key={record.id}
                  layoutId={record.id}
                  draggable
                  onDragStart={(e: any) => handleDragStart(e, record.id)}
                  onDragEnd={(e: any) => setDraggedRecordId(null)}
                  onClick={() => setDetailRecord(record)}
                  className={cn(
                    "group relative p-4 rounded-2xl border cursor-grab active:cursor-grabbing transition-all duration-300",
                    isDarkMode 
                      ? "bg-[#181824]/80 backdrop-blur-md border-white/10 hover:border-brand-500/50 hover:shadow-2xl hover:shadow-brand-500/20 hover:-translate-y-1" 
                      : "bg-white border-slate-200 hover:border-brand-500 shadow-sm hover:shadow-xl hover:-translate-y-1"
                  )}
                >
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-500/0 via-brand-500/0 to-brand-500/0 group-hover:from-brand-500/5 group-hover:to-purple-500/5 transition-all pointer-events-none" />

                  <div className="flex flex-col gap-3 relative z-10">
                    {/* Priority & More */}
                    <div className="flex items-center justify-between">
                      {priorityCol && record.values[priorityCol.id] ? (
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                          String(record.values[priorityCol.id]).toLowerCase().includes('alta') || String(record.values[priorityCol.id]).toLowerCase().includes('high')
                            ? "bg-red-500/10 text-red-500" 
                            : "bg-slate-500/10 text-slate-500"
                        )}>
                          {String(record.values[priorityCol.id])}
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5">
                          {record.values.folio || record.id.slice(-6)}
                        </span>
                      )}
                      <button className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-all">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Title */}
                    <h5 className={cn(
                      "text-sm font-bold leading-snug line-clamp-2",
                      isDarkMode ? 'text-slate-100' : 'text-slate-800'
                    )}>
                      {titleCol && record.values[titleCol.id] ? record.values[titleCol.id] : (record.values.title || record.values.name || 'Sin título')}
                    </h5>

                    {/* Tags / Sub-info */}
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {dateCol && record.values[dateCol.id] && (
                        <div className={cn(
                          "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold",
                          new Date(record.values[dateCol.id]) < new Date() 
                            ? "bg-red-500/10 text-red-500" // Overdue
                            : (isDarkMode ? "bg-white/5 text-slate-400" : "bg-slate-50 text-slate-500")
                        )}>
                          <Clock className="w-3 h-3" />
                          {new Date(record.values[dateCol.id]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>

                    {/* Footer: Assignee & Action */}
                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        {userCol && record.values[userCol.id] ? (
                          <div className="flex items-center gap-2">
                            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-sm", hashColor(record.id, AVATAR_COLORS))}>
                              {String(record.values[userCol.id]).charAt(0).toUpperCase()}
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 truncate max-w-[80px]">
                              {String(record.values[userCol.id]).split('@')[0]}
                            </span>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-dashed border-slate-300 dark:border-white/20 flex items-center justify-center text-slate-400">
                            <User className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${isDarkMode ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-brand-500/20 hover:text-brand-400' : 'bg-slate-50 text-slate-400 hover:bg-brand-50 hover:text-brand-500'}`}>
                          <Maximize2 className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Empty State Spot */}
            {(!groupedRecords[col.label] || groupedRecords[col.label].length === 0) && (
              <div className={`h-32 rounded-[24px] border border-dashed flex items-center justify-center ${isDarkMode ? 'border-white/5 bg-white/[0.01]' : 'border-slate-200 bg-slate-50/50'}`}>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Suelta aquí</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
