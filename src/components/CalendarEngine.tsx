import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCampaignStore, type RecordData, type TableDefinition } from '../store/useCampaignStore';
import { useTheme } from '../context/ThemeContext';
import { cn, hashColor, AVATAR_COLORS } from '../lib/utils';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, User, Filter, MoreHorizontal, X, 
  Layers, Database, Tag, FileText, Info
} from 'lucide-react';

export default function CalendarEngine() {
  const { isDarkMode } = useTheme();
  const { activeProjectId, tables, allProjectRecords } = useCampaignStore();
  
  // 1. Get all tables of this project
  const projectTables = useMemo(() => 
    tables.filter(t => t.projectId === activeProjectId),
    [tables, activeProjectId]
  );

  // 2. Aggregate all records that have a date column
  const allDatedRecords = useMemo(() => {
    const dated: any[] = [];
    
    projectTables.forEach(table => {
      const dateCols = table.columnDefinitions.filter(c => 
        c.type === 'date' || 
        c.id === 'date' || 
        ['fecha', 'date', 'vencimiento', 'entrega', 'plazo', 'dia', 'day', 'created', 'updated'].some(word => 
          c.name.toLowerCase().includes(word) || c.id.toLowerCase().includes(word)
        )
      );
      
      if (dateCols.length === 0) return;

      const tableRecords = allProjectRecords.filter(r => r.tableId === table.id);
      
      tableRecords.forEach(rec => {
        dateCols.forEach(col => {
          const dateVal = rec.values[col.id];
          if (dateVal) {
            dated.push({
              ...rec,
              _date: new Date(dateVal),
              _tableName: table.name,
              _tableId: table.id,
              _tableColor: hashColor(table.id, AVATAR_COLORS),
              _colName: col.name
            });
          }
        });
      });
    });

    return dated.sort((a, b) => a._date.getTime() - b._date.getTime());
  }, [projectTables, allProjectRecords]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // Calendar Logic
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);
    
    const result = [];
    // Padding for previous month
    const prevMonthDays = daysInMonth(year, month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      result.push({ day: prevMonthDays - i, date: new Date(year, month - 1, prevMonthDays - i), currentMonth: false });
    }
    // Days of current month
    for (let d = 1; d <= days; d++) {
      result.push({ day: d, date: new Date(year, month, d), currentMonth: true });
    }
    // Padding for next month
    const remaining = 42 - result.length;
    for (let i = 1; i <= remaining; i++) {
      result.push({ day: i, date: new Date(year, month + 1, i), currentMonth: false });
    }
    return result;
  }, [currentDate]);

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden bg-transparent">
      {/* Calendar Header — Premium Style */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-8">
          <div>
            <h2 className={`text-4xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {monthNames[currentDate.getMonth()]}
            </h2>
            <p className="text-sm font-bold text-slate-500 tracking-widest uppercase">{currentDate.getFullYear()}</p>
          </div>
          
          <div className={`flex items-center gap-1 p-1.5 rounded-2xl border ${isDarkMode ? 'bg-black/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className={`p-2 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-50 text-slate-600'}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className={`px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-xl ${isDarkMode ? 'hover:bg-white/10 text-brand-400' : 'hover:bg-slate-50 text-brand-600'}`}
            >
              Hoy
            </button>
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className={`p-2 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-50 text-slate-600'}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-2xl border text-[11px] font-black uppercase tracking-widest",
            isDarkMode ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"
          )}>
            <Layers className="w-3.5 h-3.5" />
            {allDatedRecords.length} Eventos Globales
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 flex flex-col gap-1 overflow-hidden">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["dom", "lun", "mar", "mié", "jue", "vie", "sáb"].map(day => (
            <div key={day} className="text-center py-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 opacity-60">
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-1 border border-white/5 rounded-[32px] overflow-hidden bg-black/20 backdrop-blur-sm">
          {calendarDays.map((cell, idx) => {
            const isToday = cell.date.toDateString() === new Date().toDateString();
            const dayRecords = allDatedRecords.filter(r => 
              r._date.getDate() === cell.day && 
              r._date.getMonth() === cell.date.getMonth() && 
              r._date.getFullYear() === cell.date.getFullYear()
            );

            return (
              <div 
                key={idx} 
                className={cn(
                  "relative p-3 flex flex-col gap-2 transition-all duration-300 border-[0.5px] border-white/5",
                  !cell.currentMonth ? "opacity-20" : "opacity-100",
                  isDarkMode 
                    ? (isToday ? "bg-brand-500/[0.03]" : "bg-transparent hover:bg-white/[0.02]") 
                    : (isToday ? "bg-brand-50" : "bg-white/50 hover:bg-white")
                )}
              >
                <div className="flex items-center justify-between z-10">
                  <span className={cn(
                    "text-sm font-black w-7 h-7 flex items-center justify-center rounded-full transition-all",
                    isToday ? "bg-brand-500 text-white shadow-lg shadow-brand-500/40" : (isDarkMode ? "text-slate-400" : "text-slate-900")
                  )}>
                    {cell.day}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar-thin pr-1">
                  {dayRecords.map((rec: any, rIdx: number) => (
                    <motion.div 
                      key={`${rec.id}-${rIdx}`}
                      whileHover={{ x: 3 }}
                      onClick={() => setSelectedRecord(rec)}
                      className={cn(
                        "group flex flex-col gap-0.5 p-2.5 rounded-xl text-[10px] cursor-pointer transition-all border shadow-sm relative overflow-hidden",
                        isDarkMode 
                          ? "bg-white/5 border-white/5 hover:bg-white/10" 
                          : "bg-white border-slate-100 hover:border-slate-200"
                      )}
                    >
                      {/* Source Indicator Line */}
                      <div className={cn("absolute left-0 top-0 bottom-0 w-1 opacity-60", rec._tableColor)} />
                      
                      <div className="flex items-center justify-between gap-2 overflow-hidden pl-1">
                        <span className={cn("font-black truncate flex-1", isDarkMode ? "text-slate-200" : "text-slate-700")}>
                          {rec.values.title || rec.values.nombre || rec.values.folio || 'Evento'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 pl-1 opacity-60">
                        <Database className="w-2.5 h-2.5" />
                        <span className="text-[8px] font-black uppercase tracking-widest truncate">
                          {rec._tableName}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Modal — Premium Detail View */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRecord(null)}
              className="absolute inset-0 bg-[#030305]/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                "relative w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border flex flex-col max-h-[85vh]",
                isDarkMode ? "bg-[#0f0f13] border-white/10 shadow-black/60" : "bg-white border-slate-200"
              )}
            >
              {/* Modal Header */}
              <div className={cn(
                "p-8 border-b flex items-start justify-between gap-4",
                selectedRecord._tableColor, "bg-opacity-10"
              )}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg", selectedRecord._tableColor)}>
                      <Database className="w-3 h-3" />
                      ORIGEN: {selectedRecord._tableName}
                    </div>
                    <div className={cn("px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/10 text-white/80 border border-white/10")}>
                      CAMPO: {selectedRecord._colName}
                    </div>
                  </div>
                  <h3 className="text-4xl font-black text-white leading-tight tracking-tighter">
                    {selectedRecord.values.title || selectedRecord.values.nombre || 'Detalles del Pendiente'}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedRecord(null)}
                  className="p-3 rounded-2xl bg-black/20 text-white/50 hover:text-white hover:bg-black/40 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Fecha del Evento
                    </p>
                    <p className={cn("text-sm font-bold", isDarkMode ? "text-white" : "text-slate-900")}>
                      {selectedRecord._date.toLocaleDateString('es-ES', { 
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Tag className="w-3 h-3" /> Folio / ID
                    </p>
                    <p className={cn("text-sm font-bold", isDarkMode ? "text-white" : "text-slate-900")}>
                      {selectedRecord.values.folio || selectedRecord.id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <FileText className="w-3 h-3" /> Información Completa
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(selectedRecord.values).map(([key, value]: [string, any]) => {
                      if (key === 'folio') return null;
                      return (
                        <div key={key} className={cn(
                          "p-4 rounded-2xl border flex flex-col gap-1",
                          isDarkMode ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-100"
                        )}>
                          <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">{key}</span>
                          <span className={cn("text-xs font-bold", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t bg-black/20 flex justify-end">
                <button 
                  onClick={() => setSelectedRecord(null)}
                  className="px-8 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest transition-all"
                >
                  Cerrar Vista
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
