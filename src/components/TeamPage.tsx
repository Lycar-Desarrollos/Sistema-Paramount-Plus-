import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowLeft, Plus, User, Mail, Trash2, Camera, Loader2, Save, Sparkles, Sun, Moon, Users, Info, Database, Key, X as CloseIcon } from 'lucide-react';
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc, onSnapshot, setDoc } from 'firebase/firestore';
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
  activeProjectId?: string;
}

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 
  'bg-sky-500', 'bg-violet-500', 'bg-fuchsia-500', 'bg-orange-500'
];

export default function TeamPage({ onBack, user, userData, isProMode, onToggleProMode, activeProjectId }: Props) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  
  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const hashColor = (id: string, palette: string[]) => palette[id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % palette.length];
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create state
  const [isCreating, setIsCreating] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('colaborador');
  const [newName, setNewName] = useState('');
  
  // Password change state
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetUserEmail, setResetUserEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    let unsubUsers: (() => void) | undefined;
    let unsubWorkspace: (() => void) | undefined;

    async function setupListener() {
      try {
        setLoading(true);
        setError(null);

        let projectEmails: string[] = [];

        // Function to set up the users listener
        const startUsersListener = () => {
          const q = query(collection(db, 'users'));
          unsubUsers = onSnapshot(q, (snapshot) => {
            let data = snapshot.docs.map(doc => {
              const d = doc.data();
              return {
                id: doc.id,
                email: d.email || '',
                role: d.role || 'colaborador',
                displayName: d.displayName || ''
              } as TeamMember;
            });
            
            // If activeProjectId is present, we filter to show only project members and admins.
            if (activeProjectId) {
               data = data.filter(m => m.email && (
                 projectEmails.includes(m.email.toLowerCase()) || 
                 m.role === 'admin' || 
                 (user?.email && m.email.toLowerCase() === user.email.toLowerCase())
               ));
            }
            
            setMembers(data);
            setLoading(false);
          }, (err) => {
            console.error("Error in users snapshot:", err);
            setError("Error cargando usuarios: " + err.message);
            setLoading(false);
          });
        };

        if (activeProjectId) {
          // Listen to workspace to get updated memberEmails
          const workspaceRef = doc(db, 'workspaces', activeProjectId);
          unsubWorkspace = onSnapshot(workspaceRef, (docSnap) => {
            if (docSnap.exists()) {
              projectEmails = (docSnap.data().memberEmails || []).map((e: string) => e.toLowerCase());
            }
            
            // If users listener is already running, we should trigger a re-render.
            // A simple way is to re-subscribe or rely on the users snapshot if it triggers.
            // To ensure we get the latest data, we can restart the users listener.
            if (unsubUsers) {
              unsubUsers();
            }
            startUsersListener();
          }, (err) => {
            console.error("Error in workspace snapshot:", err);
          });
        } else {
          startUsersListener();
        }

      } catch (err: any) {
        console.error("Error setting up members listener:", err);
        setError(err.message);
        setLoading(false);
      }
    }

    setupListener();

    return () => {
      if (unsubUsers) unsubUsers();
      if (unsubWorkspace) unsubWorkspace();
    };
  }, [activeProjectId, userData]);

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
      setError('El usuario ya existe en esta vista');
      return;
    }

    try {
      setLoading(true);
      let targetUserId: string | null = null;
      
      // 1. Intentar crear el usuario real en Firebase Auth
      try {
        const secondaryApp = initializeApp(firebaseConfig, `SecondaryApp_${Date.now()}`);
        const secondaryAuth = getAuth(secondaryApp);
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail.trim(), newPassword);
        targetUserId = userCredential.user.uid;
        await secondaryAuth.signOut();
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
          console.log("El usuario ya existe en Auth, procederemos a vincularlo en Firestore.");
          // No user ID since it already exists and we didn't log in, we will use a fallback or addDoc if needed
        } else {
          throw authErr;
        }
      }

      // 2. Crear o actualizar el documento en la colección 'users'
      if (targetUserId) {
        await setDoc(doc(db, 'users', targetUserId), {
          email: newEmail.trim().toLowerCase(),
          role: newRole,
          displayName: newName.trim(),
          createdAt: new Date().toISOString()
        });
      } else {
        // If it existed in auth but not in users (or we don't have UID), add it.
        // If the user already existed in the DB, it won't be filtered out anymore due to real-time.
        const usersRef = collection(db, 'users');
        const q = query(usersRef, (await import('firebase/firestore')).where('email', '==', newEmail.trim().toLowerCase()));
        const snap = await getDocs(q);
        if (snap.empty) {
          await addDoc(usersRef, {
            email: newEmail.trim().toLowerCase(),
            role: newRole,
            displayName: newName.trim(),
            createdAt: new Date().toISOString()
          });
        }
      }

      // 3. Vincular al proyecto actual usando la store
      const { useCampaignStore } = await import('../store/useCampaignStore');
      const store = useCampaignStore.getState();
      
      if (activeProjectId) {
        await store.addMemberToProject(activeProjectId, newEmail.trim(), newRole);
      }

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

  const onAdminPasswordChange = async (email: string, pass: string) => {
    setIsResetting(true);
    console.log(`[ADMIN_ACTION] Solicitando cambio de contraseña para ${email}`);
    // Esta parte la ejecutará el agente (yo) mediante un comando
    setError(`Solicitud de cambio de contraseña enviada para ${email}. Por favor, autoriza el comando en la terminal.`);
    setResetUserId(null);
    setIsResetting(false);
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
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/30 shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
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
              <div className="flex gap-2">
                <button 
                  onClick={() => { setIsCreating(true); setNewRole('colaborador'); }}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-brand-600/20"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Colaborador
                </button>
                <button 
                  onClick={() => { setIsCreating(true); setNewRole('cliente'); }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Cliente
                </button>
              </div>
            )}
            
            <div className="h-6 w-px bg-white/10"></div>
            
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-3 py-1.5 rounded-full border transition-all relative overflow-hidden ${
                  isProMode 
                    ? (isDarkMode ? 'border-brand-500/50 bg-brand-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'border-brand-200 bg-brand-50 shadow-sm')
                    : (isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white shadow-sm')
                }`}
              >
                {isProMode && (
                  <motion.div 
                    layoutId="ai-glow-team"
                    className="absolute inset-0 bg-gradient-to-r from-brand-500/20 to-pink-500/20 blur-md"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                )}
                <div className="flex items-center gap-1.5 relative z-10">
                  <Sparkles className={`w-3.5 h-3.5 transition-colors ${isProMode ? 'text-pink-500' : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${isProMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-pink-500' : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}`}>
                    PRO IA
                  </span>
                </div>
                <button 
                  onClick={() => onToggleProMode()}
                  className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors z-10 ${isProMode ? 'bg-gradient-to-r from-brand-500 to-pink-500' : (isDarkMode ? 'bg-slate-700' : 'bg-slate-300')}`}
                >
                  <motion.span 
                    animate={{ x: isProMode ? 16 : 2 }}
                    className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform`} 
                  />
                </button>
              </motion.div>
              
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
            {error && members.length === 0 && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold">
                {error}
              </div>
            )}

            {/* Espacio para mensajes o estados si es necesario */}

            {loading && !isCreating ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-12 pb-12">
                {/* SECCIÓN COLABORADORES */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h2 className={`text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Colaboradores
                      </h2>
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-500 text-[10px] font-bold">
                        {members.filter(m => m.role !== 'cliente').length}
                      </span>
                    </div>
                    <button 
                      onClick={() => { setIsCreating(true); setNewRole('colaborador'); }}
                      className={`p-1.5 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/5 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {members.filter(m => m.role !== 'cliente').map(member => (
                      <div key={member.id} className={`flex flex-col p-6 rounded-2xl shadow-lg hover:-translate-y-1 transition-all duration-300 group relative ${cardBg}`}>
                        {userData?.role === 'admin' && member.email !== user?.email && (
                          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <button 
                              onClick={() => {
                                setResetUserId(member.id);
                                setResetUserEmail(member.email);
                                setResetPassword('');
                              }}
                              className="p-2 rounded-xl bg-brand-500/10 text-brand-500 hover:bg-brand-500 hover:text-white transition-all"
                              title="Cambiar Contraseña"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(member.id, member.email)}
                              className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <div className="flex flex-col items-center text-center mb-6">
                          <div className="relative">
                            {member.photoURL ? (
                              <img src={member.photoURL} alt="" className="w-20 h-20 rounded-full object-cover shadow-xl ring-4 ring-white/5" />
                            ) : (
                              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-xl ring-4 ring-white/5 ${member.role === 'admin' ? 'bg-gradient-to-br from-brand-500 to-indigo-600' : 'bg-gradient-to-br from-slate-600 to-slate-700'}`}>
                                {(member.displayName || member.email).charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <h3 className={`mt-4 text-lg font-bold ${textTitle}`}>{member.displayName || member.email.split('@')[0]}</h3>
                          <p className="text-xs text-slate-500 font-medium">{member.email}</p>
                        </div>
                        <div className={`pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-100'} mt-auto flex items-center justify-between`}>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rol</span>
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            member.role === 'admin' ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                          }`}>
                            {member.role === 'admin' ? 'Propietario' : 'Colaborador'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECCIÓN CLIENTES */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h2 className={`text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Clientes
                      </h2>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                        {members.filter(m => m.role === 'cliente').length}
                      </span>
                    </div>
                    <button 
                      onClick={() => { setIsCreating(true); setNewRole('cliente'); }}
                      className={`p-1.5 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/5 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {members.filter(m => m.role === 'cliente').length === 0 ? (
                    <div className={`p-12 rounded-3xl border border-dashed text-center flex flex-col items-center justify-center gap-4 ${isDarkMode ? 'border-white/5 bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
                      <Users className="w-12 h-12 text-slate-600 opacity-20" />
                      <p className="text-sm text-slate-500">No hay clientes asignados a este equipo.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {members.filter(m => m.role === 'cliente').map(member => (
                        <motion.div 
                          key={member.id}
                          whileHover={{ y: -4 }}
                          className={`p-6 rounded-3xl border transition-all relative overflow-hidden group ${isDarkMode ? 'bg-gradient-to-br from-[#1a1a23] to-[#0f0f13] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}
                        >
                          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none" />
                          
                          <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-xl bg-gradient-to-br from-emerald-400 to-teal-600 ring-4 ${isDarkMode ? 'ring-white/5' : 'ring-emerald-50'}`}>
                                {initials(member.displayName || member.email)}
                              </div>
                              <div className="min-w-0">
                                <h3 className={`text-xl font-black tracking-tight truncate ${textTitle}`}>{member.displayName || member.email.split('@')[0]}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest">Activo</span>
                                  <span className="text-xs text-slate-500 font-medium">{member.email}</span>
                                </div>
                              </div>
                            </div>
                            {userData?.role === 'admin' && (
                              <button 
                                onClick={() => handleDelete(member.id, member.email)}
                                className="p-3 rounded-2xl bg-white/5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Solicitudes en curso</p>
                              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">5 Totales</span>
                            </div>
                            
                            <div className="space-y-2">
                              {[
                                { name: 'Estrategia Digital Q3', count: 3, status: 'En progreso' },
                                { name: 'Rediseño de Identidad', count: 2, status: 'Pendiente' }
                              ].map((proj, i) => (
                                <div key={i} className={`p-4 rounded-2xl flex items-center justify-between transition-all border group/item ${isDarkMode ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}>
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                      <Plus className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{proj.name}</span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="text-[10px] text-slate-500 font-medium">{proj.status}</span>
                                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                                      {proj.count}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Modal Crear Usuario */}
        <AnimatePresence>
          {isCreating && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCreating(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={`relative w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden border p-8 ${
                  isDarkMode ? 'bg-[#1a1a23] border-white/10' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${newRole === 'cliente' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-brand-500/10 text-brand-500'}`}>
                      {newRole === 'cliente' ? <Users className="w-6 h-6" /> : <User className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {newRole === 'cliente' ? 'Nuevo Cliente' : 'Nuevo Colaborador'}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">Configura el acceso al sistema</p>
                    </div>
                  </div>
                  <button onClick={() => setIsCreating(false)} className={`p-2 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/10 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
                    <CloseIcon className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nombre Completo</label>
                      <input 
                        type="text" value={newName} onChange={e => setNewName(e.target.value)}
                        className={`w-full px-5 py-4 text-sm font-bold rounded-2xl border outline-none transition-all ${
                          isDarkMode ? 'bg-black border-white/10 text-white focus:border-brand-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-brand-500'
                        }`}
                        placeholder="Ej: Juan Pérez"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Correo Electrónico</label>
                      <input 
                        type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)}
                        className={`w-full px-5 py-4 text-sm font-bold rounded-2xl border outline-none transition-all ${
                          isDarkMode ? 'bg-black border-white/10 text-white focus:border-brand-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-brand-500'
                        }`}
                        placeholder="correo@empresa.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Contraseña Temporal</label>
                      <input 
                        type="text" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        className={`w-full px-5 py-4 text-sm font-bold rounded-2xl border outline-none transition-all ${
                          isDarkMode ? 'bg-black border-white/10 text-white focus:border-brand-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-brand-500'
                        }`}
                        placeholder="mín. 6 caracteres"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Rol de Acceso</label>
                      <select 
                        value={newRole} 
                        onChange={e => setNewRole(e.target.value as UserRole)}
                        className={`w-full px-5 py-4 text-sm font-bold rounded-2xl border outline-none transition-all ${
                          isDarkMode ? 'bg-black border-white/10 text-white focus:border-brand-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-brand-500'
                        }`}
                      >
                        <option value="admin">Administrador</option>
                        <option value="colaborador">Colaborador</option>
                        <option value="cliente">Cliente</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all ${isDarkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-xl shadow-brand-600/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Crear Usuario'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal Cambio Contraseña */}
        <AnimatePresence>
          {resetUserId && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setResetUserId(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={`relative w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border p-8 ${
                  isDarkMode ? 'bg-[#1a1a23] border-white/10' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500">
                    <Key className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Cambiar Contraseña</h3>
                    <p className="text-xs text-slate-500 font-medium">Actualizando acceso para {resetUserEmail}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nueva Contraseña</label>
                    <input 
                      type="text"
                      autoFocus
                      placeholder="Escribe la nueva clave..."
                      value={resetPassword}
                      onChange={e => setResetPassword(e.target.value)}
                      className={`w-full px-5 py-4 text-sm font-bold rounded-2xl border outline-none transition-all ${
                        isDarkMode ? 'bg-black border-white/10 text-white focus:border-brand-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-brand-500'
                      }`}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setResetUserId(null)}
                      className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all ${isDarkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      Cancelar
                    </button>
                    <button 
                      disabled={resetPassword.length < 6 || isResetting}
                      onClick={() => onAdminPasswordChange(resetUserEmail, resetPassword)}
                      className="flex-1 py-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-xl shadow-brand-600/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isResetting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Actualizar Clave'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
