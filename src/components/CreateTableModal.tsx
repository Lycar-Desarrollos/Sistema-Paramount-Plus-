import React, { useState, useRef } from 'react';
import { X, Layout, Upload, FileText, Table as TableIcon, ArrowRight, Loader2, Send } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

import { useTheme } from '../context/ThemeContext';

interface Props {
  onClose: () => void;
  onCreate: (name: string, template?: { columns: string[], labels: Record<string, string> }, rows?: any[], type?: 'general' | 'requests') => Promise<void>;
}

export default function CreateTableModal({ onClose, onCreate }: Props) {
  const { isDarkMode } = useTheme();
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'blank' | 'import' | 'form'>('blank');
  const [isLoading, setIsLoading] = useState(false);
  const [importedData, setImportedData] = useState<{ columns: string[], labels: Record<string, string>, rows: any[] } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    if (file.name.endsWith('.csv')) {
      reader.onload = (event) => {
        const text = event.target?.result as string;
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            processData(results.data);
          }
        });
      };
      reader.readAsText(file);
    } else {
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        processData(json);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const processData = (data: any[]) => {
    if (data.length === 0) return;
    
    const keys = Object.keys(data[0]);
    const columns = keys.map(k => k.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').substring(0, 40) || `col_${Date.now()}`);
    const labels: Record<string, string> = {};
    keys.forEach((k, i) => {
      labels[columns[i]] = k; // original Excel header as display label
    });

    const rows = data.map(item => {
      const newItem: any = {};
      keys.forEach((k, i) => {
        newItem[columns[i]] = item[k] !== undefined && item[k] !== null ? String(item[k]) : '';
      });
      return newItem;
    });

    setImportedData({ columns, labels, rows });
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    
    let templateData;
    if (mode === 'import' && importedData) {
      templateData = { columns: importedData.columns, labels: importedData.labels };
    }

    try {
      const tableType = mode === 'form' ? 'requests' : 'general';
      await onCreate(name.trim(), templateData, importedData?.rows, tableType);
      onClose();
    } catch (error) {
      console.error("Error creating table:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 ${
        isDarkMode ? 'bg-[#0f0f13] border border-white/10' : 'bg-white border border-slate-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-8 py-6 border-b ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Nueva Tabla
          </h2>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Table Name */}
          <div className="space-y-3">
            <label className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Nombre de la tabla
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={mode === 'form' ? "Ej: Solicitudes de Clientes" : "Ej: Seguimiento de Leads"}
              className={`w-full px-5 py-4 rounded-2xl border-2 outline-none transition-all text-base font-medium ${
                isDarkMode 
                  ? 'bg-white/5 border-white/5 focus:border-brand-500 text-white' 
                  : 'bg-slate-50 border-slate-100 focus:border-brand-500 text-slate-900'
              }`}
            />
          </div>

          {/* Creation Mode */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setMode('blank')}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all text-center ${
                mode === 'blank'
                  ? 'border-brand-500 bg-brand-500/5'
                  : (isDarkMode ? 'border-white/5 bg-white/5 hover:border-white/10' : 'border-slate-100 bg-slate-50 hover:border-slate-200')
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mode === 'blank' ? 'bg-brand-500 text-white' : 'bg-slate-500/20 text-slate-400'}`}>
                <Layout className="w-5 h-5" />
              </div>
              <span className={`text-[11px] font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Tabla Normal</span>
            </button>

            <button
              onClick={() => setMode('import')}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all text-center ${
                mode === 'import'
                  ? 'border-brand-500 bg-brand-500/5'
                  : (isDarkMode ? 'border-white/5 bg-white/5 hover:border-white/10' : 'border-slate-100 bg-slate-50 hover:border-slate-200')
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mode === 'import' ? 'bg-brand-500 text-white' : 'bg-slate-500/20 text-slate-400'}`}>
                <Upload className="w-5 h-5" />
              </div>
              <span className={`text-[11px] font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Importar CSV</span>
            </button>

            <button
              onClick={() => setMode('form')}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all text-center ${
                mode === 'form'
                  ? 'border-emerald-500 bg-emerald-500/5'
                  : (isDarkMode ? 'border-white/5 bg-white/5 hover:border-white/10' : 'border-slate-100 bg-slate-50 hover:border-slate-200')
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mode === 'form' ? 'bg-emerald-500 text-white' : 'bg-slate-500/20 text-slate-400'}`}>
                <Send className="w-5 h-5" />
              </div>
              <span className={`text-[11px] font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Formulario Público</span>
            </button>
          </div>

          {/* Import Zone */}
          {mode === 'import' && (
            <div className={`p-6 rounded-2xl border-2 border-dashed animate-in fade-in slide-in-from-top-4 duration-300 ${
              importedData 
                ? (isDarkMode ? 'border-brand-500/50 bg-brand-500/5' : 'border-brand-500/50 bg-brand-50')
                : (isDarkMode ? 'border-white/10 hover:border-white/20' : 'border-slate-200 hover:border-slate-300')
            }`}>
              {!importedData ? (
                <div className="flex flex-col items-center text-center">
                  <Upload className="w-8 h-8 text-brand-500 mb-3" />
                  <p className={`text-xs font-medium mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Sube tu archivo .csv o .xlsx
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv, .xlsx, .xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
                      isDarkMode ? 'bg-white text-slate-900 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    Seleccionar archivo
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <TableIcon className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold truncate max-w-[180px] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{fileName}</h3>
                      <p className="text-[10px] text-slate-500 font-medium">{importedData.rows.length} filas detectadas</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setImportedData(null); setFileName(null); }}
                    className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors ${isDarkMode ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900'}`}
                  >
                    Cambiar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Form Explainer Zone */}
          {mode === 'form' && (
            <div className={`p-4 rounded-xl border animate-in fade-in slide-in-from-top-4 duration-300 ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
              <div className="flex gap-3 items-start">
                <FileText className={`w-5 h-5 shrink-0 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <div>
                  <h4 className={`text-xs font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>Modo Formulario</h4>
                  <p className={`text-[11px] mt-1 ${isDarkMode ? 'text-emerald-200' : 'text-emerald-600/80'}`}>
                    Crea una tabla con un enlace público. Las columnas que configures serán las preguntas que el cliente deba responder. Podrán subir archivos y todo llegará a esta tabla.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className={`px-6 py-3 rounded-2xl text-sm font-bold transition-colors ${isDarkMode ? 'text-slate-500 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim() || isLoading || (mode === 'import' && !importedData)}
              className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg ${
                !name.trim() || isLoading || (mode === 'import' && !importedData)
                  ? (isDarkMode ? 'bg-white/5 text-slate-600' : 'bg-slate-100 text-slate-400')
                  : (mode === 'form' 
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20' 
                      : (isDarkMode ? 'bg-white text-slate-900 hover:bg-slate-200 shadow-white/5' : 'bg-slate-900 text-white hover:bg-slate-800'))
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  Crear Tabla
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
