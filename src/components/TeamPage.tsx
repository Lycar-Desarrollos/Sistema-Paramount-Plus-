import React, { useState, useEffect, useRef } from 'react';
import { Shield, ArrowLeft, Plus, User, Mail, Trash2, Camera, Loader2, Save, Sparkles, Sun, Moon } from 'lucide-react';
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, storage, firebaseConfig } from '../firebase';
import type { UserRole } from '../context/AuthContext';
import { UserMenu } from './UserMenu';
import { useTheme } from '../context/ThemeContext';

interface TeamMember {
  id: string;
  email: string;
  role: UserRole;
  displayName?: string;
  photoURL?: string;
}

interface Props {
  onBack: () => void;
  user: any;
  userData: any;
  isProMode: boolean;
  onToggleProMode: () => void;
}

export default function TeamPage({ onBack, user, userData, isProMode, onToggleProMode }: Props) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create state
  const [isCreating, setIsCreating] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('colaborador');
  const [newName, setNewName] = useState('');
  
  // Upload states
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TeamMember[];
      setMembers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword.trim()) {
      setError('Correo y contraseña son obligatorios');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (members.find(m => m.email.toLowerCase() === newEmail.toLowerCase())) {
      setError('El usuario ya existe');
      return;
    }

    try {
      setLoading(true);
      
      // 1. Crear el usuario real en Firebase Auth usando una app secundaria
      const secondaryApp = initializeApp(firebaseConfig, `SecondaryApp_${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail.trim(), newPassword);
      const newUserId = userCredential.user.uid;
      
      await secondaryAuth.signOut(); // Desloguear la app secundaria

      // 2. Crear el documento en la base de datos con su UID real
      await updateDoc(doc(db, 'users', newUserId), {
        email: newEmail.trim(),
        role: newRole,
        displayName: newName.trim(),
        createdAt: Date.now()
      }).catch(async () => {
         // Si no existe (es lo normal), lo creamos con setDoc (firestore-rules permiten)
         const { setDoc } = await import('firebase/firestore');
         await setDoc(doc(db, 'users', newUserId), {
           email: newEmail.trim(),
           role: newRole,
           displayName: newName.trim(),
           createdAt: Date.now()
         });
      });
      
      setMembers([...members, { id: newUserId, email: newEmail.trim(), role: newRole, displayName: newName.trim() }]);
      setIsCreating(false);
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      setNewRole('colaborador');
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (email === user?.email) {
      setError('No puedes eliminarte a ti mismo');
      return;
    }
    if (!window.confirm(`¿Estás seguro de eliminar a ${email}?`)) return;
    
    try {
      await deleteDoc(doc(db, 'users', id));
      setMembers(members.filter(m => m.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleChangeRole = async (id: string, email: string, role: UserRole) => {
    if (email === user?.email) {
      setError('No puedes cambiar tu propio rol');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', id), { role });
      setMembers(members.map(m => m.id === id ? { ...m, role } : m));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePhotoUpload = async (id: string, email: string, file: File) => {
    if (!file) return;
    // Permitir subir foto propia o ser administrador
    if (email !== user?.email && userData?.role !== 'admin') {
      setError('No tienes permisos para cambiar esta foto');
      return;
    }

    try {
      setUploadingId(id);
      const fileRef = ref(storage, `profile_photos/${id}_${Date.now()}`);
      await uploadBytes(fileRef, file);
      const photoURL = await getDownloadURL(fileRef);
      
      await updateDoc(doc(db, 'users', id), { photoURL });
      setMembers(members.map(m => m.id === id ? { ...m, photoURL } : m));
    } catch (err: any) {
      setError('Error al subir la imagen: ' + err.message);
    } finally {
      setUploadingId(null);
    }
  };

  const bgPage = isDarkMode ? 'bg-[#030305]' : 'bg-slate-50';
  const textTitle = isDarkMode ? 'text-white' : 'text-slate-900';
  const cardBg = isDarkMode ? 'bg-[#13131a] border border-white/5' : 'bg-white border border-slate-200';

  return (
    <div className={`flex h-screen w-full overflow-hidden ${bgPage}`}>
      {/* Sidebar (Minimal) */}
      <aside className={`w-64 border-r flex flex-col z-20 ${isDarkMode ? 'bg-[#0a0a0f] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="p-4 flex items-center gap-3">
          <button onClick={onBack} className={`p-2 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/5 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            N
          </div>
          <span className={`font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Gestión</span>
        </div>
        
        <div className="p-4 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-3 px-2">Ajustes</p>
          <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isDarkMode ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900'}`}>
            <Shield className="w-4 h-4 text-brand-500" />
            <span className="text-sm font-medium">Equipo y Roles</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full">
        <header className={`h-16 flex items-center justify-between px-6 border-b z-20 sticky top-0 ${isDarkMode ? 'bg-[#030305]/80 border-white/5' : 'bg-white/80 border-slate-200'} backdrop-blur-xl`}>
          <div className="flex items-center gap-3">
            <h1 className={`text-lg font-bold ${textTitle}`}>Gestión de equipo</h1>
            <span className="px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-500 text-xs font-bold uppercase tracking-wider">Business</span>
          </div>
          <div className="flex items-center gap-4">
            {userData?.role === 'admin' && (
              <button 
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-brand-500/20"
              >
                <Plus className="w-4 h-4" />
                Nuevo Perfil
              </button>
            )}
            
            <div className="h-6 w-px bg-white/10"></div>
            
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-3 px-3 py-1.5 rounded-full border transition-all ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white shadow-sm'}`}>
                <div className="flex items-center gap-1.5">
                  <Sparkles className={`w-3.5 h-3.5 transition-colors ${isProMode ? 'text-pink-500' : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${isProMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-pink-500' : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}`}>
                    PRO IA
                  </span>
                </div>
                <button 
                  onClick={() => onToggleProMode()}
                  className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${isProMode ? 'bg-gradient-to-r from-brand-500 to-pink-500' : (isDarkMode ? 'bg-slate-700' : 'bg-slate-300')}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${isProMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}
                title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
            
            <UserMenu user={user} userData={userData} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold">
                {error}
              </div>
            )}

            {isCreating && userData?.role === 'admin' && (
              <form onSubmit={handleCreate} className={`p-6 rounded-2xl shadow-xl animate-in slide-in-from-top-4 duration-300 ${cardBg}`}>
                <h3 className={`text-lg font-bold mb-4 ${textTitle}`}>Crear nuevo perfil</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Nombre (opcional)</label>
                    <input 
                      type="text" value={newName} onChange={e => setNewName(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDarkMode ? 'bg-[#0a0a0f] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Correo electrónico</label>
                    <input 
                      type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDarkMode ? 'bg-[#0a0a0f] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      placeholder="correo@empresa.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Contraseña (temporal)</label>
                    <input 
                      type="text" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDarkMode ? 'bg-[#0a0a0f] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      placeholder="min. 6 caracteres"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Rol</label>
                    <select 
                      value={newRole} onChange={e => setNewRole(e.target.value as UserRole)}
                      className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDarkMode ? 'bg-[#0a0a0f] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                    >
                      <option value="admin">Administrador</option>
                      <option value="colaborador">Colaborador</option>
                      <option value="cliente">Cliente</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setIsCreating(false)} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading} className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Crear Perfil
                  </button>
                </div>
              </form>
            )}

            {loading && !isCreating ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map(member => (
                  <div key={member.id} className={`flex flex-col p-6 rounded-2xl shadow-lg hover:-translate-y-1 transition-all duration-300 group relative ${cardBg}`}>
                    
                    {/* Delete button for Admin */}
                    {userData?.role === 'admin' && member.email !== user?.email && (
                      <button 
                        onClick={() => handleDelete(member.id, member.email)}
                        className="absolute top-4 right-4 p-2 rounded-xl opacity-0 group-hover:opacity-100 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200"
                        title="Eliminar perfil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <div className="flex flex-col items-center text-center mb-6 relative">
                      <div className="relative group/avatar">
                        {member.photoURL ? (
                          <img src={member.photoURL} alt={member.displayName} className="w-20 h-20 rounded-full object-cover shadow-xl ring-4 ring-white/5" />
                        ) : (
                          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-xl ring-4 ring-white/5 ${member.role === 'admin' ? 'bg-gradient-to-br from-red-500 to-rose-600' : member.role === 'cliente' ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                            {(member.displayName || member.email || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        
                        {/* Solo el admin o el dueño del perfil pueden cambiar la foto */}
                        {(userData?.role === 'admin' || member.email === user?.email) && (
                          <button 
                            onClick={() => fileInputRefs.current[member.id]?.click()}
                            className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center transition-all cursor-pointer"
                          >
                            {uploadingId === member.id ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                          </button>
                        )}
                        <input 
                          type="file" accept="image/*" className="hidden"
                          ref={el => { fileInputRefs.current[member.id] = el; }}
                          onChange={(e) => {
                            if (e.target.files?.[0]) handlePhotoUpload(member.id, member.email, e.target.files[0]);
                          }}
                        />
                      </div>
                      <h3 className={`mt-4 text-lg font-bold ${textTitle}`}>{member.displayName || 'Sin nombre'}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                        <Mail className="w-3.5 h-3.5" /> {member.email}
                      </p>
                    </div>

                    <div className={`pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-100'} mt-auto`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Nivel de Acceso</span>
                        {userData?.role === 'admin' && member.email !== user?.email ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleChangeRole(member.id, member.email, e.target.value as UserRole)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider focus:outline-none cursor-pointer ${
                              member.role === 'admin' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                              member.role === 'cliente' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                              'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                            }`}
                          >
                            <option value="admin">Administrador</option>
                            <option value="colaborador">Colaborador</option>
                            <option value="cliente">Cliente</option>
                          </select>
                        ) : (
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                            member.role === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                            member.role === 'cliente' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                            'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          }`}>
                            {member.role}
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
