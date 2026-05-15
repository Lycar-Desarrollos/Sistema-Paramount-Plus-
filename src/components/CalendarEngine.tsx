import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCampaignStore, type RecordData, type ColumnDefinition } from '../store/useCampaignStore';
import { useTheme } from '../context/ThemeContext';
import { cn, hashColor, AVATAR_COLORS } from '../lib/utils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Filter, MoreHorizontal, Maximize2 } from 'lucide-react';

interface CalendarEngineProps {
  tableId: string;
}

export default function CalendarEngine({ tableId }: CalendarEngineProps) {
  const { isDarkMode } = useTheme();
  const tables = useCampaignStore(state => state.tables);
  const table = tables.find(t => t.id === tableId);
  const records = useCampaignStore(state => state.records.filter((r: any) => r.tableId === tableId));
  const updateRecordField = useCampaignStore(state => state.updateRecordField);
  const setDetailRecord = useCampaignStore(state => state.setDetailRecord);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedRecordId, setDraggedRecordId] = useState<string | null>(null);

  // 1. Column Detection
  const dateCol = useMemo(() => table?.columnDefinitions.find(c => c.type === 'date'), [table]);
  const titleCol = useMemo(() => table?.columnDefinitions.find(c => c.id === 'title' || c.id === 'name' || c.name.toLowerCase().includes('título')), [table]);
  const userCol = useMemo(() => table?.columnDefinitions.find(c => c.type === 'user' || c.type === 'email'), [table]);
  const statusCol = useMemo(() => table?.columnDefinitions.find(c => c.type === 'select' || c.id === 'status' || c.name.toLowerCase().includes('estado')), [table]);

  // 2. Calendar Logic
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);
    
    const result = [];
    // Padding for previous month
    for (let i = 0; i < firstDay; i++) {
      result.push({ day: null, date: null });
    }
    // Days of current month
    for (let d = 1; d <= days; d++) {
      const date = new Date(year, month, d);
      result.push({ day: d, date });
    }
    return result;
  }, [currentDate]);

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  if (!dateCol) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-20 h-20 rounded-3xl bg-brand-500/10 flex items-center justify-center mb-6 shadow-xl shadow-brand-500/10">
          <CalendarIcon className="w-10 h-10 text-brand-500" />
        </div>
        <h3 className={`text-xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Vista de Calendario Desactivada</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          Esta tabla no tiene una columna de **Fecha**. Añade una para poder organizar tus registros en el calendario.
        </p>
      </div>
    );
  }

  const handleDragStart = (e: React.DragEvent, recordId: string) => {
    setDraggedRecordId(recordId);
    e.dataTransfer.setData('recordId', recordId);
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    const recordId = e.dataTransfer.getData('recordId');
    if (recordId && dateCol) {
      // Keep existing time if possible, or just set date
      updateRecordField(recordId, dateCol.id, date.toISOString());
    }
    setDraggedRecordId(null);
  };

  return (
    <div className="flex-1 flex flex-col p-8 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <h2 className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {monthNames[currentDate.getMonth()]}
            </h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">{currentDate.getFullYear()}</p>
          </div>
          
          <div className={`flex items-center gap-1 p-1.5 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200 shadow-inner'}`}>
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
              className={`p-2 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-white text-slate-600 shadow-sm'}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-white text-slate-700 shadow-sm'}`}
            >
              Hoy
            </button>
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
              className={`p-2 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-white text-slate-600 shadow-sm'}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${isDarkMode ? 'bg-white/5 border-white/5 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
            <Clock className="w-3.5 h-3.5" />
            Sincronización en tiempo real
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 grid grid-cols-7 gap-4 auto-rows-fr">
        {["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"].map(day => (
          <div key={day} className="px-2 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-transparent">
            {day.slice(0, 3)}
          </div>
        ))}

        {calendarDays.map((cell, idx) => {
          const dayRecords = cell.date ? records.filter((r: any) => {
             const rDateVal = r.values[dateCol.id];
             if (!rDateVal) return false;
             const rDate = new Date(rDateVal);
             return rDate.getDate() === cell.day && rDate.getMonth() === currentDate.getMonth() && rDate.getFullYear() === currentDate.getFullYear();
          }) : [];

          const isToday = cell.date?.toDateString() === new Date().toDateString();

          return (
            <div 
              key={idx} 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => cell.date && handleDrop(e, cell.date)}
              className={cn(
                "group relative min-h-[140px] rounded-[28px] border p-4 flex flex-col gap-3 transition-all duration-500 overflow-hidden",
                !cell.day ? "opacity-0 pointer-events-none" : "hover:scale-[1.02] cursor-default",
                draggedRecordId ? (isDarkMode ? "border-brand-500/30 bg-brand-500/5 shadow-2xl shadow-brand-500/10" : "border-brand-500/50 bg-brand-50 shadow-xl") : "",
                isDarkMode 
                  ? (isToday ? "bg-brand-500/5 border-brand-500/40 shadow-lg shadow-brand-500/10" : "bg-[#13131a] border-white/5 hover:border-white/10") 
                  : (isToday ? "bg-brand-50 border-brand-200 shadow-md" : "bg-white border-slate-100 hover:border-slate-200 shadow-sm")
              )}
            >
              <div className="flex items-center justify-between relative z-10">
                <span className={cn(
                  "text-sm font-black transition-colors",
                  isToday ? "text-brand-500" : (isDarkMode ? "text-slate-500 group-hover:text-white" : "text-slate-400 group-hover:text-slate-900")
                )}>
                  {cell.day}
                </span>
                {dayRecords.length > 0 && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-500'}`}>
                    {dayRecords.length}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar-thin relative z-10">
                <AnimatePresence>
                  {dayRecords.map((rec: any) => {
                    const statusVal = statusCol ? rec.values[statusCol.id] : null;
                    const statusOpt = statusCol?.config?.options?.find((o: any) => o.label === statusVal);
                    
                    return (
                      <motion.div 
                        key={rec.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, rec.id)}
                        onDragEnd={() => setDraggedRecordId(null)}
                        onClick={() => setDetailRecord(rec)}
                        layoutId={rec.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "p-2.5 rounded-2xl text-[10px] font-bold cursor-grab active:cursor-grabbing border transition-all relative overflow-hidden group/card",
                          isDarkMode 
                            ? "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-slate-300" 
                            : "bg-slate-50 border-slate-100 hover:bg-white hover:border-slate-200 shadow-sm text-slate-700"
                        )}
                      >
                        {/* Status Accent */}
                        {statusOpt && (
                          <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: statusOpt.color }} />
                        )}
                        
                        <div className="flex flex-col gap-1">
                          <p className="truncate group-hover/card:text-brand-500 transition-colors">
                            {titleCol ? rec.values[titleCol.id] : (rec.values.title || rec.values.name || 'Sin título')}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                              {rec.values.folio || rec.id.slice(-4)}
                            </span>
                            {userCol && rec.values[userCol.id] && (
                              <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[6px] font-black text-white", hashColor(rec.id, AVATAR_COLORS))}>
                                {String(rec.values[userCol.id]).charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Decorative backgrounds */}
              {isToday && (
                <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
