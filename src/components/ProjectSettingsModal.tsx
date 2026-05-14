import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, UserMinus, Crown, User, Loader2, Check } from 'lucide-react';
import { useCampaignStore, type Project } from '../store/useCampaignStore';
import { useTheme } from '../context/ThemeContext';

interface Props {
  project: Project;
  currentUser: any;
  userData: any;
  onClose: () => void;
}

export default function ProjectSettingsModal({ project, currentUser, userData, onClose }: Props) {
  const { isDarkMode } = useTheme();
  const { addMemberToProject, removeMemberFromProject, allUsers } = useCampaignStore();

  const [newEmail, setNewEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAdmin = userData?.role === 'admin';
  const members: string[] = (project as any).memberEmails || [];

  const memberDetails = members.map(email => {
    const user = allUsers.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
    return {
      email,
      displayName: user?.displayName || email.split('@')[0],
      photoURL: (user as any)?.photoURL,
      isOwner: email.toLowerCase() === currentUser?.email?.toLowerCase()
    };
  });

  const handleAddMember = async () => {
    if (!newEmail.trim()) return;
    const emailLower = newEmail.trim().toLowerCase();

    if (members.map(m => m.toLowerCase()).includes(emailLower)) {
      setError('Este usuario ya es miembro del proyecto.');
      return;
    }

    setIsAdding(true);
    setError('');
    try {
      await addMemberToProject(project.id, emailLower, 'colaborador');
      setNewEmail('');
      setSuccess('Colaborador agregado');
      setTimeout(() => setSuccess(''), 2000);
    } catch (e: any) {
      setError(e.message || 'Error al agregar miembro');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (email: string) => {
    if (email.toLowerCase() === currentUser?.email?.toLowerCase()) return;
    try {
      await removeMemberFromProject(project.id, email);
      setSuccess('Colaborador eliminado');
      setTimeout(() => setSuccess(''), 2000);
    } catch (e: any) {
      setError(e.message || 'Error al eliminar miembro');
    }
  };

  const bg = isDarkMode ? 'bg-[#0f0f13] border border-white/10' : 'bg-white border border-slate-200';
  const inputCls = isDarkMode
    ? 'bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-brand-500'
    : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500';

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl ${bg}`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-7 py-5 border-b ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
          <div>
            <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Colaboradores
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{project.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-7 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">

          {/* Feedback */}
          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-semibold">
                <Check className="w-4 h-4 flex-shrink-0" /> {success}
              </motion.div>
            )}
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold">
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add member */}
          {isAdmin && (
            <div className="flex gap-2">
              <select
                value={newEmail}
                onChange={e => { setNewEmail(e.target.value); setError(''); }}
                className={`flex-1 px-3 py-2.5 rounded-xl text-sm outline-none transition-all appearance-none ${inputCls}`}
              >
                <option value="">— Selecciona un colaborador —</option>
                {allUsers
                  .filter((u: any) => u.email && !members.map(m => m.toLowerCase()).includes(u.email.toLowerCase()))
                  .map((u: any) => (
                    <option key={u.id || u.email} value={u.email}>
                      {u.displayName || u.email.split('@')[0]} ({u.email})
                    </option>
                  ))
                }
              </select>
              <button
                onClick={handleAddMember}
                disabled={!newEmail || isAdding}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Agregar
              </button>
            </div>
          )}

          {/* Member list */}
          <div className="space-y-2">
            {memberDetails.length === 0 && (
              <p className="text-center text-slate-500 text-sm py-4">No hay colaboradores</p>
            )}
            {memberDetails.map(member => (
              <div key={member.email} className={`flex items-center justify-between px-4 py-3 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  {member.photoURL ? (
                    <img src={member.photoURL} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-white/10" />
                  ) : (
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${member.isOwner ? 'bg-gradient-to-br from-brand-500 to-indigo-600' : 'bg-gradient-to-br from-slate-600 to-slate-700'}`}>
                      {member.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{member.displayName}</p>
                    <p className="text-[11px] text-slate-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.isOwner ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-500 text-[10px] font-black uppercase tracking-wider border border-brand-500/20">
                      <Crown className="w-3 h-3" /> Admin
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-500/10 text-slate-500 text-[10px] font-black uppercase tracking-wider border border-slate-500/20">
                      <User className="w-3 h-3" /> Colaborador
                    </span>
                  )}
                  {isAdmin && !member.isOwner && member.email.toLowerCase() !== currentUser?.email?.toLowerCase() && (
                    <button
                      onClick={() => handleRemoveMember(member.email)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all"
                      title="Quitar del proyecto"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`px-7 py-4 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-100'} flex justify-end`}>
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-sm font-bold transition-all">
            Listo
          </button>
        </div>
      </motion.div>
    </div>
  );
}
