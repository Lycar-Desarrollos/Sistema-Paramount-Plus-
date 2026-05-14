import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Loader2, CheckCircle2, Upload, FileText, Send } from 'lucide-react';
import type { ColumnDefinition } from '../store/useCampaignStore';

export default function PublicFormView() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [tableDef, setTableDef] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File>>({});

  useEffect(() => {
    const fetchTable = async () => {
      try {
        const pathParts = window.location.pathname.split('/');
        const tableId = pathParts[pathParts.length - 1];
        
        if (!tableId) {
          setError("URL inválida");
          setLoading(false);
          return;
        }

        const tableDoc = await getDoc(doc(db, 'tables', tableId));
        if (tableDoc.exists()) {
          setTableDef({ id: tableDoc.id, ...tableDoc.data() });
        } else {
          setError("Formulario no encontrado");
        }
      } catch (err: any) {
        console.error("Error loading form:", err);
        setError("Error al cargar el formulario");
      } finally {
        setLoading(false);
      }
    };

    fetchTable();
  }, []);

  const handleFileChange = (colId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [colId]: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const finalData = { ...formData };

      // 1. Upload files
      for (const [colId, file] of Object.entries(files)) {
        const fileRef = ref(storage, `public_uploads/${tableDef.id}/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        finalData[colId] = [{
          name: file.name,
          url,
          type: file.type,
          size: file.size,
          storagePath: fileRef.fullPath
        }];
      }

      // 2. Save record
      await addDoc(collection(db, 'campaigns'), {
        tableId: tableDef.id,
        projectId: tableDef.projectId,
        values: finalData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: 'public_form'
      });

      setSuccess(true);
    } catch (err: any) {
      console.error("Submission error:", err);
      setError("Ocurrió un error al enviar el formulario. Por favor, intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error) {
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

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-12 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100 animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">¡Enviado con éxito!</h2>
          <p className="text-slate-500 font-medium">Tus respuestas han sido registradas y enviadas al equipo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col py-12 px-4 sm:px-6">
      <div className="max-w-2xl w-full mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 shadow-xl shadow-brand-500/30 mb-6">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{tableDef?.name || 'Formulario'}</h1>
          <p className="text-slate-500 mt-2 font-medium">Por favor, completa la siguiente información</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-10 space-y-8">
          {(tableDef?.columnDefinitions || []).map((col: ColumnDefinition) => {
            if (col.type === 'user' || col.type === 'link') return null; // Skip system columns

            return (
              <div key={col.id} className="space-y-3">
                <label className="block text-sm font-bold text-slate-900">
                  {col.name}
                </label>

                {col.type === 'text' && (
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:border-brand-500 focus:bg-white transition-all outline-none"
                    placeholder={`Ingresa ${col.name.toLowerCase()}...`}
                    value={formData[col.id] || ''}
                    onChange={e => setFormData({ ...formData, [col.id]: e.target.value })}
                  />
                )}

                {col.type === 'number' && (
                  <input
                    type="number"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:border-brand-500 focus:bg-white transition-all outline-none"
                    value={formData[col.id] || ''}
                    onChange={e => setFormData({ ...formData, [col.id]: Number(e.target.value) })}
                  />
                )}

                {col.type === 'select' && (
                  <select
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:border-brand-500 focus:bg-white transition-all outline-none appearance-none"
                    value={formData[col.id] || ''}
                    onChange={e => setFormData({ ...formData, [col.id]: e.target.value })}
                  >
                    <option value="" disabled>Selecciona una opción</option>
                    {(col.config?.options || []).map(opt => (
                      <option key={opt.label} value={opt.label}>{opt.label}</option>
                    ))}
                  </select>
                )}

                {col.type === 'attachment' && (
                  <div className="relative group cursor-pointer">
                    <input
                      type="file"
                      required
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={e => handleFileChange(col.id, e)}
                    />
                    <div className="w-full p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 group-hover:border-brand-500 group-hover:bg-brand-50 transition-all text-center">
                      <Upload className="w-8 h-8 text-slate-400 group-hover:text-brand-500 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-700">
                        {files[col.id] ? files[col.id].name : 'Haz clic para subir un archivo'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Imágenes, videos o documentos</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-brand-600/20 active:scale-95 disabled:opacity-50"
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
