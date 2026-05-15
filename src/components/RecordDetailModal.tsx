import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Calendar, Clock, Phone, Mail, Link as LinkIcon, Maximize2, Trash2 } from 'lucide-react';
import { useCampaignStore, type RecordData, type Table } from '../store/useCampaignStore';
import { useTheme } from '../context/ThemeContext';
import { cn, hashColor, AVATAR_COLORS } from '../lib/utils';

export default function RecordDetailModal() {
  const { isDarkMode } = useTheme();
  const { detailRecord, setDetailRecord, tables, allUsers } = useCampaignStore();

  if (!detailRecord) return null;

  const table = tables.find(t => t.id === detailRecord.tableId);
  const cols = table?.columnDefinitions || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={() => setDetailRecord(null)}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            "relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[32px] overflow-hidden border shadow-2xl",
            isDarkMode ? "bg-[#0f0f15] border-white/10" : "bg-white border-slate-200"
          )}
        >
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between px-8 py-6 border-b",
            isDarkMode ? "border-white/5" : "border-slate-100"
          )}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">
                {table?.name || 'Detalles del registro'}
              </p>
              <h2 className={cn(
                "text-xl font-black tracking-tight",
                isDarkMode ? "text-white" : "text-slate-900"
              )}>
                {(() => {
                  const titleCol = cols.find(c => c.id === 'title' || c.id === 'name' || c.name.toLowerCase().includes('título'));
                  const val = titleCol ? detailRecord.values?.[titleCol.id] : null;
                  return val ? String(val) : (detailRecord.values.folio || 'Registro');
                })()}
              </h2>
            </div>
            <button
              onClick={() => setDetailRecord(null)}
              className={cn(
                "p-2.5 rounded-xl transition-all",
                isDarkMode ? "hover:bg-white/5 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500"
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
            {cols.map(col => {
              const val = detailRecord.values?.[col.id];
              const isEmpty = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);

              return (
                <div key={col.id} className={cn(
                  "flex flex-col gap-2 pb-5 border-b last:border-0",
                  isDarkMode ? "border-white/5" : "border-slate-100"
                )}>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    {col.name}
                  </p>

                  {isEmpty ? (
                    <p className="text-sm font-medium italic text-slate-600">No especificado</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {['text','number','date','email','phone'].includes(col.type) && (
                        <p className={cn("text-sm font-semibold", isDarkMode ? "text-white" : "text-slate-900")}>
                          {String(val)}
                        </p>
                      )}

                      {col.type === 'checkbox' && (
                        <div className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                          val ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"
                        )}>
                          {val ? 'Completado' : 'Pendiente'}
                        </div>
                      )}

                      {col.type === 'select' && (
                        <span 
                          className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-black/5"
                          style={{ backgroundColor: col.config?.options?.find(o => o.label === val)?.color || '#64748b' }}
                        >
                          {String(val)}
                        </span>
                      )}

                      {col.type === 'user' && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-brand-500/10 rounded-full border border-brand-500/20">
                          <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white", hashColor(String(val), AVATAR_COLORS))}>
                            {String(val).charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-bold text-brand-500">{String(val)}</span>
                        </div>
                      )}

                      {col.type === 'link' && (
                        <div className="flex flex-wrap gap-2">
                          {(Array.isArray(val) ? val : [val]).map((link: any, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-1 bg-brand-500/5 rounded-xl border border-brand-500/10">
                              <LinkIcon className="w-3 h-3 text-brand-500" />
                              <span className="text-xs font-bold text-slate-500">{link.displayValue || 'Registro vinculado'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
