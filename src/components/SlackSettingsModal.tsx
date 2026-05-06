import React, { useState, useEffect } from 'react';
import { X, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function SlackSettingsModal({ isOpen, onClose, isDarkMode }: { isOpen: boolean, onClose: () => void, isDarkMode: boolean }) {
  const { user } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (user && isOpen) {
      getDoc(doc(db, 'users', user.uid)).then(docSnap => {
        if (docSnap.exists() && docSnap.data().slack_webhook) {
          setWebhookUrl(docSnap.data().slack_webhook);
        }
      });
    }
  }, [user, isOpen]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        slack_webhook: webhookUrl
      });
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#13131a] border border-white/10' : 'bg-white border border-slate-200'}`}>
        <div className={`p-6 border-b flex items-center justify-between ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E01E5A]/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-[#E01E5A]" />
            </div>
            <div>
              <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Integración Slack</h2>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className={`text-sm mb-4 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Configura tu <strong>Incoming Webhook URL</strong> de Slack para recibir notificaciones automáticas cuando haya cambios en tus campañas.
          </p>
          
          <label className={`block text-xs font-semibold mb-2 uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            Webhook URL
          </label>
          <input 
            type="text" 
            placeholder="https://hooks.slack.com/services/..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#E01E5A]/50 transition-all ${
              isDarkMode ? 'bg-[#0a0a0f] border-white/10 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
          
          {status === 'success' && (
            <div className="mt-4 flex items-center gap-2 text-emerald-500 text-sm font-medium bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" /> Configuración guardada correctamente
            </div>
          )}
          {status === 'error' && (
            <div className="mt-4 flex items-center gap-2 text-red-500 text-sm font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              <AlertCircle className="w-4 h-4" /> Error al guardar la configuración
            </div>
          )}
        </div>
        
        <div className={`p-6 flex items-center justify-end gap-3 ${isDarkMode ? 'bg-white/[0.02] border-t border-white/5' : 'bg-slate-50 border-t border-slate-100'}`}>
          <button 
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isDarkMode ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 rounded-xl text-sm font-medium bg-[#E01E5A] text-white hover:bg-[#C01648] transition-colors shadow-lg shadow-[#E01E5A]/20 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Integración'}
          </button>
        </div>
      </div>
    </div>
  );
}
