import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layout, Check, Loader2, Search, Briefcase, Users, Plus } from 'lucide-react';
import { collection, query, getDocs, doc, updateDoc, arrayUnion, arrayRemove, deleteField } from 'firebase/firestore';
import { db } from '../firebase';
import { useTheme } from '../context/ThemeContext';
import { useCampaignStore } from '../store/useCampaignStore';
import { cn } from '../lib/utils';

interface WorkspaceAssignmentModalProps {
  member: {
    id: string;
    email: string;
    displayName?: string;
    role: string;
  };
  onClose: () => void;
}

export default function WorkspaceAssignmentModal({ member, onClose }: WorkspaceAssignmentModalProps) {
  const { isDarkMode } = useTheme();
  const [allWorkspaces, setAllWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'workspaces'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllWorkspaces(data.sort((a: any, b: any) => b.createdAt - a.createdAt));
    } catch (err) {
      console.error('Error fetching all workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const toggleAccess = async (workspace: any) => {
    setProcessingId(workspace.id);
    const hasAccess = workspace.memberEmails?.includes(member.email.toLowerCase());
    const emailLower = member.email.toLowerCase();
    const memberKey = emailLower.replace(/\./g, '_');

    try {
      const docRef = doc(db, 'workspaces', workspace.id);
      if (hasAccess) {
        // Remove access
        await updateDoc(docRef, {
          memberEmails: arrayRemove(emailLower),
          [`members.${memberKey}`]: deleteField()
        });
        setAllWorkspaces(prev => prev.map(w => 
          w.id === workspace.id 
            ? { ...w, memberEmails: w.memberEmails.filter((e: string) => e !== emailLower) }
            : w
        ));
      } else {
        // Add access
        await updateDoc(docRef, {
          memberEmails: arrayUnion(emailLower),
          [`members.${memberKey}`]: member.role || 'colaborador'
        });
        setAllWorkspaces(prev => prev.map(w => 
          w.id === workspace.id 
            ? { ...w, memberEmails: [...(w.memberEmails || []), emailLower] }
            : w
        ));
      }
    } catch (err) {
      console.error('Error toggling workspace access:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredWorkspaces = allWorkspaces.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={cn(
          "relative w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden border flex flex-col max-h-[80vh]",
          isDarkMode ? "bg-[#1a1a23] border-white/10" : "bg-white border-slate-200"
        )}
      >
        {/* Header */}
        <div className="p-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-brand-500/10 text-brand-500">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h3 className={cn("text-xl font-black", isDarkMode ? "text-white" : "text-slate-900")}>
                  Asignar Espacios
                </h3>
                <p className="text-xs text-slate-500 font-medium">Gestiona el acceso de {member.displayName || member.email}</p>
              </div>
            </div>
            <button onClick={onClose} className={cn("p-2 rounded-xl transition-all", isDarkMode ? "hover:bg-white/10 text-slate-500" : "hover:bg-slate-100 text-slate-400")}>
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Buscar espacios de trabajo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={cn(
                "w-full pl-11 pr-4 py-3.5 text-sm font-bold rounded-2xl border outline-none transition-all",
                isDarkMode ? "bg-black/40 border-white/5 text-white focus:border-brand-500" : "bg-slate-50 border-slate-100 text-slate-900 focus:border-brand-500"
              )}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-8 pt-2 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cargando espacios...</p>
            </div>
          ) : filteredWorkspaces.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sm text-slate-500">No se encontraron espacios.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredWorkspaces.map(ws => {
                const hasAccess = ws.memberEmails?.includes(member.email.toLowerCase());
                const isProcessing = processingId === ws.id;

                return (
                  <button
                    key={ws.id}
                    onClick={() => !isProcessing && toggleAccess(ws)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                      hasAccess 
                        ? (isDarkMode ? "bg-brand-500/10 border-brand-500/30" : "bg-brand-50 border-brand-200")
                        : (isDarkMode ? "bg-white/[0.02] border-white/5 hover:border-white/10" : "bg-white border-slate-100 hover:border-slate-200 shadow-sm")
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        hasAccess ? "bg-brand-500 text-white" : (isDarkMode ? "bg-white/5 text-slate-500" : "bg-slate-100 text-slate-400")
                      )}>
                        <Layout className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={cn("text-sm font-black", isDarkMode ? "text-white" : "text-slate-900")}>
                          {ws.name}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {ws.memberEmails?.length || 0} Miembros
                        </p>
                      </div>
                    </div>

                    <div className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                      hasAccess ? "bg-brand-500 text-white" : (isDarkMode ? "bg-white/5" : "bg-slate-100")
                    )}>
                      {isProcessing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : hasAccess ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={cn("p-8 pt-4 border-t", isDarkMode ? "border-white/5 bg-black/20" : "border-slate-100 bg-slate-50/50")}>
          <button 
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-xl shadow-brand-600/20 transition-all active:scale-95"
          >
            Finalizar Asignación
          </button>
        </div>
      </motion.div>
    </div>
  );
}
