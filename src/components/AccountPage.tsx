import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, Save, Loader2, User, Mail, Shield, Sun, Moon } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useTheme } from '../context/ThemeContext';
import { useCampaignStore } from '../store/useCampaignStore';
import { Sparkles } from 'lucide-react';
import { useToast } from './Toast';

interface Props {
  user: any;
  userData: any;
  onBack: () => void;
  isProMode: boolean;
  onToggleProMode: () => void;
}

export default function AccountPage({ user, userData, onBack, isProMode, onToggleProMode }: Props) {
  const { showToast } = useToast();
  const { isDarkMode, toggleDarkMode } = useTheme();
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

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // If the image fails to load (e.g. broken URL), hide the image and show initial
    setPreviewUrl(null);
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let finalPhotoUrl = previewUrl;

      // Upload new photo if selected
      if (photoFile) {
        const timestamp = Math.round((new Date).getTime()/1000);
        const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET || "b3GNz3bXIEZZWnTXkEiNwIFMTao";
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "doylm03ih";
        const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY || "838234118983858";

        if (!apiSecret || !cloudName || !apiKey) {
          throw new Error("Faltan las credenciales de Cloudinary en el archivo .env");
        }

        const strToSign = `timestamp=${timestamp}${apiSecret}`;

        const encoder = new TextEncoder();
        const data = encoder.encode(strToSign);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const formData = new FormData();
        formData.append("file", photoFile);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp.toString());
        formData.append("signature", signature);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Error de Cloudinary: ${errText}`);
        }
        
        const json = await res.json();
        finalPhotoUrl = json.secure_url;
      }

      // Update Firestore user document using setDoc with merge to support legacy users
      await setDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        description: description.trim(),
        ...(finalPhotoUrl && { photoURL: finalPhotoUrl })
      }, { merge: true });

      showToast("Perfil actualizado correctamente", "success");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      showToast(error.message || "Error al actualizar el perfil.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-screen ${isDarkMode ? 'bg-[#0f0f13] text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className={`h-14 flex items-center justify-between px-4 sm:px-6 border-b flex-shrink-0 ${isDarkMode ? 'border-white/5 bg-[#13131a]' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className={`p-2 -ml-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/5 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-brand-500" />
            <h1 className="font-bold text-lg">Ajustes de Cuenta</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
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
                layoutId="ai-glow-account"
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
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className={`p-8 rounded-[32px] border ${isDarkMode ? 'bg-[#13131a] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h2 className="text-xl font-bold mb-6">Perfil Público</h2>
            
            <div className="flex flex-col sm:flex-row gap-8">
              {/* Avatar Edit */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  {previewUrl ? (
                    <img src={previewUrl} onError={handleImageError} alt="Avatar" className="w-32 h-32 rounded-full object-cover ring-4 ring-white/10 shadow-xl" />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-brand-500 to-pink-500 flex items-center justify-center text-4xl font-bold text-white ring-4 ring-white/10 shadow-xl">
                      {displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-10 h-10 text-white" />
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handlePhotoSelect} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
                <p className="text-xs text-slate-500 font-medium">Haz clic para cambiar tu foto</p>
              </div>

              {/* Form Fields */}
              <div className="flex-1 space-y-5">
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
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        isDarkMode 
                          ? 'bg-[#0f0f13] border-white/10 text-white focus:border-brand-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-brand-500 focus:bg-white'
                      }`}
                      placeholder="Tu nombre completo"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={user.email || ''}
                      disabled
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all opacity-70 cursor-not-allowed ${
                        isDarkMode 
                          ? 'bg-[#0f0f13] border-white/10 text-white' 
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    El correo electrónico no se puede cambiar
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className={`w-full p-4 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none ${
                      isDarkMode 
                        ? 'bg-[#0f0f13] border-white/10 text-white focus:border-brand-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-brand-500 focus:bg-white'
                    }`}
                    placeholder="Cuenta algo sobre ti o tu rol en la empresa..."
                  />
                </div>
                
                <div className="pt-4 border-t border-white/5">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-3 bg-gradient-to-r from-brand-500 to-pink-500 hover:from-brand-600 hover:to-pink-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
