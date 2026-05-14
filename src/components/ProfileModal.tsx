import React, { useState, useRef } from 'react';
import { X, Camera, Save, Loader2, User } from 'lucide-react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useTheme } from '../context/ThemeContext';
import { useToast } from './Toast';
import { uploadToCloudinary, getCloudinaryThumbnail } from '../services/cloudinary';

interface Props {
  user: any;
  userData: any;
  onClose: () => void;
}

export default function ProfileModal({ user, userData, onClose }: Props) {
  const { showToast } = useToast();
  const { isDarkMode } = useTheme();
  const [displayName, setDisplayName] = useState(userData?.displayName || user?.displayName || '');
  const [description, setDescription] = useState(userData?.description || '');
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(userData?.photoURL || user?.photoURL || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let finalPhotoUrl = previewUrl;

      // Upload new photo to Cloudinary using unsigned preset (natic_unsigned)
      if (photoFile) {
        const result = await uploadToCloudinary(photoFile, `naticbox/profile_photos/${user.uid}`);
        // Use optimized thumbnail for profile display
        finalPhotoUrl = getCloudinaryThumbnail(result.url, 400, 400);
      }

      // Update Firestore user document (setDoc with merge to handle legacy users)
      await setDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        description: description.trim(),
        ...(finalPhotoUrl && { photoURL: finalPhotoUrl })
      }, { merge: true });

      showToast("Perfil actualizado correctamente", "success");
      onClose();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      showToast(error.message || "Error al actualizar el perfil.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 ${
        isDarkMode ? 'bg-[#0f0f13] border border-white/10' : 'bg-white border border-slate-200'
      }`}>
        <div className={`flex items-center justify-between px-8 py-6 border-b ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Editar Perfil
          </h2>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Avatar Edit */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {previewUrl ? (
                <img src={previewUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover ring-4 ring-white/10 shadow-xl" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white ring-4 ring-white/10 shadow-xl">
                  {displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoSelect} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            <p className="text-xs text-slate-500">Haz clic para cambiar tu foto</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Nombre
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    isDarkMode 
                      ? 'bg-[#13131a] border-white/10 text-white focus:border-brand-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-brand-500 focus:bg-white'
                  }`}
                  placeholder="Tu nombre completo"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`w-full p-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none ${
                  isDarkMode 
                    ? 'bg-[#13131a] border-white/10 text-white focus:border-brand-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-brand-500 focus:bg-white'
                }`}
                placeholder="Cuenta algo sobre ti o tu rol..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                isDarkMode ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-brand-500 to-pink-500 hover:from-brand-600 hover:to-pink-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
