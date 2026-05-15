import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCampaignStore, type RecordData, type ColumnDefinition } from '../store/useCampaignStore';
import { useTheme } from '../context/ThemeContext';
import { cn, hashColor, AVATAR_COLORS } from '../lib/utils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Filter, MoreHorizontal } from 'lucide-react';

interface CalendarEngineProps {
  tableId: string;
}

export default function CalendarEngine({ tableId }: CalendarEngineProps) {
  const { isDarkMode } = useTheme();
  const tables = useCampaignStore(state => state.tables);
  const table = tables.find(t => t.id === tableId);
  const records = useCampaignStore(state => state.records[tableId] || []);
  
  const [currentDate, setCurrentDate] = useState(new Date());

  // 1. Find Date Column
  const dateCol = useMemo(() => {
    return table?.columnDefinitions.find(c => c.type === 'date' || c.id === 'date' || c.name.toLowerCase().includes('fecha'));
  }, [table]);

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
        <div className="w-20 h-20 rounded-3xl bg-brand-500/10 flex items-center justify-center mb-6">
          <CalendarIcon className="w-10 h-10 text-brand-500" />
        </div>
        <h3 className={`text-xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>No se encontró columna de Fecha</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          Para activar la vista de Calendario, asegúrate de tener una columna de tipo "Fecha" en esta tabla.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-8 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-6">
          <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {monthNames[currentDate.getMonth()]} <span className="text-slate-500">{currentDate.getFullYear()}</span>
          </h2>
          <div className={`flex items-center gap-1 p-1 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
              className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-white text-slate-600 shadow-sm'}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-white text-slate-600'}`}
            >
              Hoy
            </button>
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
              className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-white text-slate-600 shadow-sm'}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${isDarkMode ? 'bg-white/5 text-slate-400 border border-white/10' : 'bg-white text-slate-600 border border-slate-200 shadow-sm'}`}>
            <Filter className="w-3.5 h-3.5" />
            Filtrar
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-[auto,1fr] gap-4">
        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(day => (
          <div key={day} className="text-center py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            {day}
          </div>
        ))}

        {calendarDays.map((cell, idx) => {
          const dayRecords = cell.date ? records.filter(r => {
             const rDate = r.values[dateCol.id] ? new Date(r.values[dateCol.id]) : null;
             return rDate && rDate.getDate() === cell.day && rDate.getMonth() === currentDate.getMonth() && rDate.getFullYear() === currentDate.getFullYear();
          }) : [];

          const isToday = cell.date?.toDateString() === new Date().toDateString();

          return (
            <div 
              key={idx} 
              className={cn(
                "group relative min-h-[120px] rounded-[24px] border p-3 flex flex-col gap-2 transition-all duration-300",
                !cell.day ? "opacity-0" : "",
                isDarkMode 
                  ? (isToday ? "bg-brand-500/5 border-brand-500/30" : "bg-[#13131a] border-white/5 hover:border-white/10") 
                  : (isToday ? "bg-brand-50 border-brand-200" : "bg-white border-slate-100 hover:border-slate-200 shadow-sm")
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-xs font-black",
                  isToday ? "text-brand-500" : (isDarkMode ? "text-white" : "text-slate-900")
                )}>
                  {cell.day}
                </span>
                {dayRecords.length > 0 && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${isDarkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                    {dayRecords.length}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar-thin">
                {dayRecords.map(rec => (
                  <div 
                    key={rec.id} 
                    className={cn(
                      "p-2 rounded-xl text-[10px] font-bold truncate cursor-pointer transition-all",
                      isDarkMode ? "bg-white/5 hover:bg-white/10 text-slate-300" : "bg-slate-50 hover:bg-slate-100 text-slate-600"
                    )}
                    title={rec.values.title || 'Sin título'}
                  >
                    {rec.values.folio || rec.id.slice(-4)}: {rec.values.title || 'Sin título'}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
