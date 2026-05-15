import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCampaignStore } from '../store/useCampaignStore';
import { uploadToCloudinary } from '../services/cloudinary';
import { Loader2, CheckCircle2, Upload, FileText, Send, X, Image, File as FileIcon, AlertCircle } from 'lucide-react';
import type { ColumnDefinition } from '../store/useCampaignStore';

// ── Per-field file state ──────────────────────────────────────────────────
interface FileEntry {
  file: File;
  preview?: string; // object URL for images
}

export default function PublicFormView() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tableDef, setTableDef] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  // Multiple files per attachment column
  const [files, setFiles] = useState<Record<string, FileEntry[]>>({});

  useEffect(() => {
    const fetchTable = async () => {
      try {
        const pathParts = window.location.pathname.split('/');
        const tableId = pathParts[pathParts.length - 1];
        if (!tableId) { setError('URL inválida'); setLoading(false); return; }

        const tableDoc = await getDoc(doc(db, 'tables', tableId));
        if (tableDoc.exists()) {
          setTableDef({ id: tableDoc.id, ...tableDoc.data() });
        } else {
          setError('Formulario no encontrado');
        }
      } catch (err: any) {
        console.error('Error loading form:', err);
        setError('Error al cargar el formulario. Verifica el enlace.');
      } finally {
        setLoading(false);
      }
    };
    fetchTable();
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(files).flat().forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
    };
  }, [files]);

  const handleFileAdd = (colId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const entries: FileEntry[] = selected.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    setFiles(prev => ({ ...prev, [colId]: [...(prev[colId] || []), ...entries] }));
    e.target.value = ''; // reset so same file can be re-added if needed
  };

  const handleFileRemove = (colId: string, idx: number) => {
    setFiles(prev => {
      const updated = [...(prev[colId] || [])];
      if (updated[idx]?.preview) URL.revokeObjectURL(updated[idx].preview!);
      updated.splice(idx, 1);
      return { ...prev, [colId]: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setUploadProgress('');

    try {
      const finalData = { ...formData };

      // Upload all attachment files to Cloudinary
      const attachmentCols = Object.entries(files).filter(([, entries]) => entries.length > 0);
      if (attachmentCols.length > 0) {
        for (const [colId, entries] of attachmentCols) {
          const uploaded: any[] = [];
          for (let i = 0; i < entries.length; i++) {
            const { file } = entries[i];
            setUploadProgress(`Subiendo archivo ${i + 1} de ${entries.length}...`);
            const result = await uploadToCloudinary(file, `naticbox/public_forms/${tableDef.id}`);
            uploaded.push({
              name: result.name,
              url: result.url,
              type: result.type,
              size: result.size,
              publicId: result.publicId,
            });
          }
          finalData[colId] = uploaded;
        }
      }
      setUploadProgress('Guardando respuestas...');

      // 2. Intentar obtener datos del proyecto y usuario (puede fallar por permisos en formularios públicos)
      let ownerId = tableDef.ownerId || tableDef.userId || '';
      let projectName = tableDef.name || 'NaticBox';
      // Fallbacks en orden: (1) tabla tiene webhook, (2) env variable, (3) buscar en Firestore
      let webhookUrl: string = tableDef.slack_webhook || import.meta.env.VITE_SLACK_WEBHOOK_URL || '';

      try {
        const projSnap = await getDoc(doc(db, 'projects', tableDef.projectId));
        if (projSnap.exists()) {
          const projData = projSnap.data();
          ownerId = projData.userId || ownerId;
          projectName = projData.name || projectName;
          
          const userSnap = await getDoc(doc(db, 'users', ownerId));
          if (userSnap.exists() && userSnap.data().slack_webhook) {
            webhookUrl = userSnap.data().slack_webhook;
          }
        }
      } catch (e) {
        console.warn('Permisos restringidos — usando fallback de webhook desde .env o tabla.');
      }

      // Generar folio si es necesario
      let generatedFolio = finalData.folio;
      if (tableDef.columnDefinitions.some((c: any) => c.id === 'folio') && !generatedFolio) {
        generatedFolio = `NT-${Date.now().toString().slice(-4)}${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
      }

      // 3. Guardar en Firestore (incluyendo owner para disparar Cloud Functions)
      await addDoc(collection(db, 'campaigns'), {
        tableId: tableDef.id,
        workspaceId: tableDef.projectId,
        projectId: tableDef.projectId,
        owner: ownerId, // Crucial para que la Cloud Function encuentre el webhook
        createdBy: ownerId,
        values: {
          ...finalData,
          ...(generatedFolio ? { folio: generatedFolio } : {})
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: 'public_form',
        submittedAt: new Date().toISOString(),
      });

      setUploadProgress('Notificando al equipo...');

      // 4. Enviar notificación a Slack vía Proxy (opcional, pero asegura entrega desde local)
      if (webhookUrl) {
        try {
          const folio = generatedFolio || 'N/A';
          const email = finalData.email || 'No proporcionado';

          // Construir resumen de todos los campos
          const fieldsSummary = tableDef.columnDefinitions
            .filter((c: any) => !c.hiddenInForm && c.id !== 'folio')
            .map((col: any) => {
              const val = finalData[col.id];
              if (val === undefined || val === null || val === '') return null;
              
              let displayVal = String(val);
              if (Array.isArray(val)) {
                displayVal = val.map((v: any) => v.name || v.displayValue || v).join(', ');
              }
              return `• *${col.name}:* ${displayVal}`;
            })
            .filter(Boolean)
            .join('\n');

          // En local (npm run dev) usamos el proxy de Vite
          // En producción usamos la Netlify Function para evitar CORS
          const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          
          if (isLocal) {
            const localProxyUrl = webhookUrl.replace('https://hooks.slack.com', '/slack-proxy');
            await fetch(localProxyUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(slackPayload),
            });
          } else {
            const functionEndpoint = '/.netlify/functions/send-slack';
            await fetch(functionEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                webhookUrl: webhookUrl,
                payload: slackPayload
              }),
            });
          }
        } catch (slackErr) {
          console.error('Error sending Slack notification:', slackErr);
        }
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Submission error:', err);
      const msg = err?.message || '';
      if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
        setError('Error de permisos. Contacta al administrador.');
      } else if (msg.includes('preset') || msg.includes('upload_preset')) {
        setError('Error al subir archivos: el preset de Cloudinary no está configurado. Contacta al administrador.');
      } else {
        setError(msg || 'Error al enviar. Intenta de nuevo.');
      }
    } finally {
      setSubmitting(false);
      setUploadProgress('');
    }
  };

  const inputCls = 'w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:border-brand-500 focus:bg-white transition-all outline-none';

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  // ── Error (fatal) ────────────────────────────────────────────────────────
  if (error && !tableDef) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Oops</h2>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-12 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">¡Enviado con éxito!</h2>
          <p className="text-slate-500 font-medium">Tus respuestas han sido registradas y enviadas al equipo.</p>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col py-12 px-4 sm:px-6">
      <div className="max-w-2xl w-full mx-auto">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 shadow-xl shadow-brand-500/30 mb-6">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{tableDef?.name || 'Formulario'}</h1>
          <p className="text-slate-500 mt-2 font-medium">Por favor, completa la siguiente información</p>
        </div>

        {/* Submission error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 font-medium">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-10 space-y-8">
          {(tableDef?.columnDefinitions || []).map((col: ColumnDefinition) => {
            if (col.type === 'user' || col.type === 'link' || col.hiddenInForm || col.id === 'folio') return null;

            return (
              <div key={col.id} className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                  {col.name}
                  {col.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>

                {/* TEXT */}
                {col.type === 'text' && (
                  <input type="text" required={col.required} className={inputCls}
                    placeholder={`Ingresa ${col.name.toLowerCase()}...`}
                    value={formData[col.id] || ''}
                    onChange={e => setFormData({ ...formData, [col.id]: e.target.value })}
                  />
                )}

                {/* NUMBER */}
                {col.type === 'number' && (
                  <input type="number" required={col.required} className={inputCls}
                    value={formData[col.id] || ''}
                    onChange={e => setFormData({ ...formData, [col.id]: Number(e.target.value) })}
                  />
                )}

                {/* SELECT */}
                {col.type === 'select' && (
                  <select required={col.required} className={`${inputCls} appearance-none`}
                    value={formData[col.id] || ''}
                    onChange={e => setFormData({ ...formData, [col.id]: e.target.value })}
                  >
                    <option value="" disabled>Selecciona una opción</option>
                    {(col.config?.options || []).map((opt: any) => (
                      <option key={opt.label} value={opt.label}>{opt.label}</option>
                    ))}
                  </select>
                )}

                {/* DATE */}
                {col.type === 'date' && (
                  <input type="date" required={col.required} className={inputCls}
                    value={formData[col.id] || ''}
                    onChange={e => setFormData({ ...formData, [col.id]: e.target.value })}
                  />
                )}

                {/* PHONE */}
                {col.type === 'phone' && (
                  <input type="tel" required={col.required} className={inputCls}
                    placeholder="Ej: +52 55 1234 5678"
                    value={formData[col.id] || ''}
                    onChange={e => setFormData({ ...formData, [col.id]: e.target.value })}
                  />
                )}

                {/* EMAIL */}
                {col.type === 'email' && (
                  <input type="email" required={col.required} className={inputCls}
                    placeholder="correo@ejemplo.com"
                    value={formData[col.id] || ''}
                    onChange={e => setFormData({ ...formData, [col.id]: e.target.value })}
                  />
                )}

                {/* ATTACHMENT — supports multiple files, image preview */}
                {col.type === 'attachment' && (
                  <div className="space-y-3">
                    {/* Drop zone */}
                    <label className="relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:border-brand-500 hover:bg-brand-50 transition-all cursor-pointer group">
                      <Upload className="w-7 h-7 text-slate-400 group-hover:text-brand-500 mb-2 transition-colors" />
                      <p className="text-sm font-bold text-slate-700 group-hover:text-brand-600">
                        Haz clic para subir archivos
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Imágenes, videos, documentos · Opcional</p>
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={e => handleFileAdd(col.id, e)}
                      />
                    </label>

                    {/* Preview list */}
                    {(files[col.id] || []).length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(files[col.id] || []).map((entry, idx) => (
                          <div key={idx} className="relative group/file rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                            {entry.preview ? (
                              <img src={entry.preview} alt={entry.file.name}
                                className="w-full h-24 object-cover" />
                            ) : (
                              <div className="w-full h-24 flex flex-col items-center justify-center gap-1">
                                {entry.file.type.includes('pdf') ? (
                                  <FileText className="w-8 h-8 text-red-400" />
                                ) : (
                                  <FileIcon className="w-8 h-8 text-slate-400" />
                                )}
                                <p className="text-[10px] text-slate-500 font-medium px-2 text-center truncate w-full">
                                  {entry.file.name}
                                </p>
                              </div>
                            )}
                            {/* Remove */}
                            <button
                              type="button"
                              onClick={() => handleFileRemove(col.id, idx)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/file:opacity-100 transition-opacity shadow"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            {/* File name overlay for images */}
                            {entry.preview && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-2 py-1">
                                <p className="text-[10px] text-white truncate">{entry.file.name}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })}

          {/* Submit */}
          <div className="pt-4">
            {uploadProgress && (
              <div className="mb-4 flex items-center gap-2 text-sm text-brand-600 font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                {uploadProgress}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-brand-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Send className="w-6 h-6" />
                  ENVIAR RESPUESTAS
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-12 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Desarrollado con NaticBox
          </p>
        </div>
      </div>
    </div>
  );
}
