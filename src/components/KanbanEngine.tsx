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
  const records = useCampaignStore(state => state.records[tableId] || []);
  const updateRecordField = useCampaignStore(state => state.updateRecordField);
  
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
      groups[opt.label] = records.filter(r => r.values[statusCol.id] === opt.label);
    });
    // Also include "Sin Estado" if needed
    const unmatched = records.filter(r => !r.values[statusCol.id]);
    if (unmatched.length > 0) {
      groups['Sin Estado'] = unmatched;
    }
    return groups;
  }, [records, columns, statusCol]);

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
                  onDragStart={(e) => handleDragStart(e, record.id)}
                  onDragEnd={() => setDraggedRecordId(null)}
                  className={cn(
                    "group relative p-5 rounded-[24px] border cursor-grab active:cursor-grabbing transition-all duration-300",
                    isDarkMode 
                      ? "bg-[#13131a] border-white/5 hover:border-brand-500/30 hover:shadow-2xl hover:shadow-brand-500/10" 
                      : "bg-white border-slate-200 hover:border-brand-500 shadow-sm hover:shadow-xl"
                  )}
                >
                  {/* Card Content */}
                  <div className="flex flex-col gap-3">
                    {/* Folio / Tags */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest bg-brand-500/10 px-2.5 py-1 rounded-full">
                        {record.values.folio || record.id.slice(-6)}
                      </span>
                      <button className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-white/5 text-slate-500 transition-all">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Title */}
                    <h5 className={`text-sm font-bold leading-tight line-clamp-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {record.values.title || record.values.name || 'Sin título'}
                    </h5>

                    {/* Meta Info */}
                    <div className="flex items-center gap-3 mt-1">
                      {record.values.email && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                          <User className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">{record.values.email}</span>
                        </div>
                      )}
                      {record.values.date && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(record.values.date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
                      <div className="flex -space-x-2">
                        {/* Placeholder for members if any */}
                        <div className={cn("w-6 h-6 rounded-full border-2 border-[#13131a] flex items-center justify-center text-[8px] font-black text-white", hashColor(record.id, AVATAR_COLORS))}>
                          {record.values.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
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
