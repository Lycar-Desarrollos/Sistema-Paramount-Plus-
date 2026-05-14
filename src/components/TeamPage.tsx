import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowLeft, Plus, User, Mail, Trash2, Camera, Loader2, Save, Sparkles, Sun, Moon, Users, Info, Database, Key, X as CloseIcon, Pencil, X, Lock } from 'lucide-react';
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { db, firebaseConfig } from '../firebase';
import type { UserRole } from '../context/AuthContext';
import { UserMenu } from './UserMenu';
import ManageTeamModal from './ManageTeamModal';
import AIChat from './AIChat';
import { useTheme } from '../context/ThemeContext';
import { useCampaignStore } from '../store/useCampaignStore';
import { uploadToCloudinary, getCloudinaryThumbnail } from '../services/cloudinary';

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

// ─── MemberCard — extracted to a proper component so hooks work correctly ───
function MemberCard({ member, user, userData, isDarkMode, cardBg, textTitle, onResetPassword, onDelete, onPhotoUpdated }: {
  member: TeamMember;
  user: any;
  userData: any;
  isDarkMode: boolean;
  cardBg: string;
  textTitle: string;
  onResetPassword: (id: string, email: string) => void;
  onDelete: (id: string, email: string) => void;
  onPhotoUpdated: (id: string, photoURL: string) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(member.displayName || '');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localPhoto, setLocalPhoto] = useState(member.photoURL || '');

  const isOwnCard = member.email === user?.email;
  const canEdit = userData?.role === 'admin' || isOwnCard;

  const saveName = async () => {
    if (!draftName.trim()) return;
    try {
      await updateDoc(doc(db, 'users', member.id), { displayName: draftName.trim() });
    } catch (e) { console.error(e); }
    setEditingName(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optimistic preview
    const previewUrl = URL.createObjectURL(file);
    setLocalPhoto(previewUrl);
    setUploading(true);
    setUploadError(null);

    try {
      const { uploadToCloudinary, getCloudinaryThumbnail } = await import('../services/cloudinary');
      const result = await uploadToCloudinary(file, `naticbox/profile_photos/${member.id}`);
      const photoURL = getCloudinaryThumbnail(result.url, 400, 400);

      // Save to Firestore
      try {
        await updateDoc(doc(db, 'users', member.id), { photoURL });
      } catch {
        // Fallback: buscar por email
        const { getDocs, query, collection, where } = await import('firebase/firestore');
        const snap = await getDocs(query(collection(db, 'users'), where('email', '==', member.email.toLowerCase())));
        if (!snap.empty) await updateDoc(snap.docs[0].ref, { photoURL });
      }

      setLocalPhoto(photoURL);
      onPhotoUpdated(member.id, photoURL);
    } catch (err: any) {
      console.error('[MemberCard] upload error:', err);
      setUploadError('Error: ' + (err.message || 'no se pudo subir'));
      setLocalPhoto(member.photoURL || ''); // revert
    } finally {
      setUploading(false);
      // Reset the input so the same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <div className={`flex flex-col p-6 rounded-2xl shadow-lg hover:-translate-y-1 transition-all duration-300 group relative ${cardBg}`}>
      {/* Action buttons */}
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
        {canEdit && (
          <button
            onClick={() => { setEditingName(true); setDraftName(member.displayName || ''); }}
            className="p-2 rounded-xl bg-brand-500/10 text-brand-500 hover:bg-brand-500 hover:text-white transition-all"
            title="Editar nombre"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
        {userData?.role === 'admin' && !isOwnCard && (
          <>
            <button
              onClick={() => onResetPassword(member.id, member.email)}
              className="p-2 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-all"
              title="Cambiar Contraseña"
            >
              <Key className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(member.id, member.email)}
              className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="relative group/avatar">
          {localPhoto ? (
            <img src={localPhoto} alt="" className="w-20 h-20 rounded-full object-cover shadow-xl ring-4 ring-white/5" />
          ) : (
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-xl ring-4 ring-white/5 ${member.role === 'admin' ? 'bg-gradient-to-br from-brand-500 to-indigo-600' : 'bg-gradient-to-br from-slate-600 to-slate-700'}`}>
              {(member.displayName || member.email).charAt(0).toUpperCase()}
            </div>
          )}
          {/* Upload overlay */}
          {(isOwnCard || userData?.role === 'admin') && (
            <label className={`absolute inset-0 rounded-full flex items-center justify-center bg-black/50 transition-opacity cursor-pointer ${
              uploading ? 'opacity-100' : 'opacity-0 group-hover/avatar:opacity-100'
            }`}>
              {uploading
                ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                : <Camera className="w-6 h-6 text-white" />
              }
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={handleFileChange}
              />
            </label>
          )}
        </div>

        {uploadError && (
          <p className="mt-2 text-[10px] text-red-400 font-medium max-w-[160px] text-center leading-tight">{uploadError}</p>
        )}

        {/* Editable name */}
        {editingName ? (
          <div className="mt-4 flex items-center gap-2 w-full justify-center">
            <input
              autoFocus
              value={draftName}
              onChange={e => setDraftName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
              className={`text-sm font-bold text-center rounded-lg px-2 py-1 border outline-none w-36 ${isDarkMode ? 'bg-white/10 border-brand-500 text-white' : 'bg-slate-50 border-brand-500 text-slate-900'}`}
            />
            <button onClick={saveName} className="p-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-400 transition-all">
              <Save className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setEditingName(false)} className="p-1.5 rounded-lg bg-white/10 text-slate-400 hover:text-white transition-all">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <h3 className={`mt-4 text-lg font-bold ${textTitle}`}>{member.displayName || member.email.split('@')[0]}</h3>
        )}
        <p className="text-xs text-slate-500 font-medium mt-1">{member.email}</p>
      </div>

      {/* Role badge */}
      <div className={`pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-100'} mt-auto flex items-center justify-between`}>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rol</span>
        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
          member.role === 'admin' ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
        }`}>
          {member.role === 'admin' ? 'Propietario' : 'Colaborador'}
        </span>
      </div>
    </div>
  );
}

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 
  'bg-sky-500', 'bg-violet-500', 'bg-fuchsia-500', 'bg-orange-500'
];

export default function TeamPage({ onBack, user, userData, isProMode, onToggleProMode, activeProjectId }: Props) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { isAiOpen, setIsAiOpen } = useCampaignStore();
  
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

  // Use allUsers from the global store (already loaded for any authenticated user)
  const allUsers = useCampaignStore(s => s.allUsers);

  useEffect(() => {
    setLoading(true);

    // Show ALL users from the database — this is the global team management view
    const data: TeamMember[] = allUsers.map((u: any) => ({
      id: u.id,
      email: u.email || '',
      role: u.role || 'colaborador',
      displayName: u.displayName || '',
      photoURL: u.photoURL || ''
    }));

    setMembers(data);
    setLoading(false);
  }, [allUsers]);

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
    if (email !== user?.email && userData?.role !== 'admin') {
      setError('No tienes permisos para cambiar esta foto');
      return;
    }

    setError(null);
    try {
      setLoading(true);

      // 1. Upload to Cloudinary (unsigned preset natic_unsigned)
      const result = await uploadToCloudinary(file, `naticbox/profile_photos/${id}`);
      const photoURL = getCloudinaryThumbnail(result.url, 400, 400);

      // 2. Try updating the Firestore doc by the provided ID
      try {
        await updateDoc(doc(db, 'users', id), { photoURL });
      } catch (updateErr: any) {
        // Fallback: search by email (handles legacy users where ID != UID)
        const { getDocs: gd, query: q2, collection: col2, where: w } = await import('firebase/firestore');
        const snap = await gd(q2(col2(db, 'users'), w('email', '==', email.toLowerCase())));
        if (!snap.empty) {
          await updateDoc(snap.docs[0].ref, { photoURL });
        } else {
          throw new Error('No se encontró el documento del usuario en Firestore');
        }
      }

      // 3. Update local state immediately
      setMembers(prev => prev.map(m => m.id === id ? { ...m, photoURL } : m));
    } catch (err: any) {
      console.error('[TeamPage] handlePhotoUpload error:', err);
      setError('Error al subir la imagen: ' + (err.message || 'desconocido'));
    } finally {
      setLoading(false);
    }
  };


  // Estado para feedback del reset
  const [resetSuccess, setResetSuccess] = useState(false);

  const onSendResetEmail = async (email: string) => {
    setIsResetting(true);
    setError(null);
    try {
      const { auth } = await import('../firebase');
      await sendPasswordResetEmail(auth, email);
      setResetSuccess(true);
      setTimeout(() => {
        setResetUserId(null);
        setResetSuccess(false);
      }, 4000);
    } catch (err: any) {
      setError('No se pudo enviar el email: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const bgPage = isDarkMode ? 'bg-[#030305]' : 'bg-slate-50';
  const textTitle = isDarkMode ? 'text-white' : 'text-slate-900';
  const cardBg = isDarkMode ? 'bg-[#13131a] border border-white/5' : 'bg-white border border-slate-200';

  // ── Guard: solo admins o el master admin pueden entrar ──
  const MASTER_ADMIN_UID = 'RXH1eN22BtUAdJBrK4bPR3AxiO52';
  const isMasterAdmin = user?.uid === MASTER_ADMIN_UID;
  const isAdminUser = userData?.role === 'admin' || isMasterAdmin;

  if (!isAdminUser) {
    return (
      <div className={`flex h-screen w-full items-center justify-center ${bgPage}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`flex flex-col items-center gap-6 p-12 rounded-3xl border max-w-sm w-full text-center ${
            isDarkMode ? 'bg-[#13131a] border-white/5' : 'bg-white border-slate-200 shadow-xl'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h2 className={`text-xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Acceso Restringido
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Solo los administradores pueden gestionar usuarios y roles del equipo.
            </p>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl transition-all shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        </motion.div>
      </div>
    );
  }

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
              </div>
            )}
            
            <div className="h-6 w-px bg-white/10"></div>
            
            <div className="flex items-center gap-3">
                {userData?.role === 'admin' && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white shadow-sm'}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Notificaciones
                    </span>
                    <button 
                      onClick={() => setIsAiOpen(!isAiOpen)}
                      className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${isAiOpen ? 'bg-emerald-500' : (isDarkMode ? 'bg-slate-700' : 'bg-slate-300')}`}
                    >
                      <motion.span 
                        animate={{ x: isAiOpen ? 16 : 2 }}
                        className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform`} 
                      />
                    </button>
                  </div>
                )}

              
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
                        {members.length}
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
                    {members.map(member => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        user={user}
                        userData={userData}
                        isDarkMode={isDarkMode}
                        cardBg={cardBg}
                        textTitle={textTitle}
                        onResetPassword={(id, email) => { setResetUserId(id); setResetUserEmail(email); setResetPassword(''); }}
                        onDelete={(id, email) => handleDelete(id, email)}
                        onPhotoUpdated={(id, photoURL) => setMembers(prev => prev.map(m => m.id === id ? { ...m, photoURL } : m))}
                      />
                    ))}
                  </div>
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
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-brand-500/10 text-brand-500">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        Nuevo Colaborador
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
                onClick={() => { setResetUserId(null); setResetSuccess(false); setResetPassword(''); }}
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
                {resetSuccess ? (
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <Key className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className={`text-xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Email enviado</h3>
                      <p className="text-sm text-slate-500">Se envió un enlace de restablecimiento a <span className="font-bold text-brand-400">{resetUserEmail}</span>. El usuario debe revisar su correo.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500">
                        <Key className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Restablecer Acceso</h3>
                        <p className="text-xs text-slate-500 font-medium">{resetUserEmail}</p>
                      </div>
                    </div>

                    {error && (
                      <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-medium">
                        {error}
                      </div>
                    )}

                    <p className={`text-sm mb-5 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Se enviará un link seguro al correo del usuario para que pueda establecer su propia contraseña.
                    </p>

                    <button
                      disabled={isResetting}
                      onClick={() => onSendResetEmail(resetUserEmail)}
                      className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white text-sm font-black rounded-2xl transition-all shadow-xl shadow-brand-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      Enviar Link de Recuperación
                    </button>

                    <button
                      onClick={() => { setResetUserId(null); }}
                      className={`w-full mt-3 py-3 rounded-2xl text-sm font-bold transition-all ${
                        isDarkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
