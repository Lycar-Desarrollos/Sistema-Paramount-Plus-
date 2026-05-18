import React, { useState, useEffect } from 'react';
import { X, Shield, User, UserPlus, Trash2, Mail } from 'lucide-react';
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { UserRole } from '../context/AuthContext';

interface ManageTeamModalProps {
  onClose: () => void;
  currentUserEmail?: string;
}

interface TeamMember {
  id: string;
  email: string;
  role: UserRole;
}

import { useTheme } from '../context/ThemeContext';

export default function ManageTeamModal({ onClose, currentUserEmail }: ManageTeamModalProps) {
  const { isDarkMode } = useTheme();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('colaborador');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          email: d.email || '',
          role: d.role || 'colaborador'
        } as TeamMember;
      }).filter(m => m.email); // Only keep users with email
      setMembers(data);
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    
    // Check if exists
    if (members.find(m => m.email.toLowerCase() === newEmail.toLowerCase())) {
      setError('El usuario ya existe');
      return;
    }

    try {
      setLoading(true);
      const newDocRef = await addDoc(collection(db, 'users'), {
        email: newEmail.trim().toLowerCase(),
        role: newRole,
        createdAt: new Date().toISOString()
      });
      
      setIsAdding(false);
      setNewEmail('');
      setNewRole('colaborador');
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (id: string, email: string) => {
    if (email === currentUserEmail) {
      setError('No puedes eliminarte a ti mismo');
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', id));
      setMembers(members.filter(m => m.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleChangeRole = async (id: string, email: string, role: UserRole) => {
    if (email === currentUserEmail) {
      setError('No puedes cambiar tu propio rol aquí');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', id), { role });
      setMembers(members.map(m => m.id === id ? { ...m, role } : m));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 ${
        isDarkMode ? 'bg-[#13131a] border border-white/10' : 'bg-white border border-slate-200'
      }`}>
        <div className={`px-6 py-4 border-b flex items-center justify-between flex-shrink-0 ${isDarkMode ? 'border-white/5 bg-[#1a1a24]/50' : 'border-slate-100 bg-slate-50/50'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isDarkMode ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/20' : 'bg-blue-100 text-blue-600'}`}>
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Gestionar equipo</h2>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Administra los roles y accesos de los usuarios.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Miembros ({members.length})</h3>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-2 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg transition-all shadow-lg shadow-brand-500/20"
            >
              <UserPlus className="w-4 h-4" />
              Añadir usuario
            </button>
          </div>

          {isAdding && (
            <form onSubmit={handleAddMember} className={`mb-6 p-4 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Correo electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="usuario@ejemplo.com"
                      className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        isDarkMode ? 'bg-[#13131a] border border-white/10 text-white placeholder-slate-500' : 'bg-white border border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <label className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Rol</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      isDarkMode ? 'bg-[#13131a] border border-white/10 text-white' : 'bg-white border border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="admin">Administrador</option>
                    <option value="colaborador">Colaborador</option>
                    <option value="proveedor">Proveedor</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="submit" disabled={loading} className="w-full sm:w-auto px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50">
                    Añadir
                  </button>
                </div>
              </div>
            </form>
          )}

          {loading && !isAdding ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Colaboradores */}
              <div className="space-y-3">
                <h4 className={`text-[10px] font-black uppercase tracking-widest px-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Colaboradores
                </h4>
                <div className="space-y-2">
                  {members.map(member => (
                    <div key={member.id} className={`flex items-center justify-between p-3 rounded-xl border ${isDarkMode ? 'bg-[#13131a] border-white/5 hover:border-white/10' : 'bg-white border-slate-200 hover:border-slate-300'} transition-all`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${member.role === 'admin' ? 'bg-brand-500' : 'bg-slate-500'}`}>
                          {member.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{member.email}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            {member.role === 'admin' ? 'Propietario' : member.role === 'proveedor' ? 'Proveedor' : 'Colaborador'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={member.role}
                          onChange={(e) => handleChangeRole(member.id, member.email, e.target.value as UserRole)}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-bold focus:outline-none ${
                            isDarkMode ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <option value="admin">Admin</option>
                          <option value="colaborador">Colaborador</option>
                          <option value="proveedor">Proveedor</option>
                        </select>
                        <button 
                          onClick={() => handleDeleteMember(member.id, member.email)}
                          className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {members.length === 0 && (
                <div className={`text-center py-8 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  No hay usuarios configurados.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
