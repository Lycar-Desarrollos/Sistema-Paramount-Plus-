import React, { useState, useRef, useEffect } from 'react';
import { X, Layout, Database, Zap as ZapIcon, Briefcase, Code, Megaphone, Users, ArrowRight, ArrowLeft, Upload, FileText, Table } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

import { useTheme } from '../context/ThemeContext';

interface Props {
  onClose: () => void;
  onCreate: (name: string, template?: { columns: string[], labels: Record<string, string> }, rows?: any[]) => Promise<void>;
}

interface TemplateItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  columns?: string[];
  labels?: Record<string, string>;
}

const TEMPLATES: TemplateItem[] = [
  {
    id: 'blank',
    title: 'En blanco',
    description: 'Comienza desde cero con una tabla limpia.',
    icon: <Layout className="w-6 h-6" />,
    color: 'from-slate-400 to-slate-600'
  },
  {
    id: 'marketing',
    title: 'Marketing',
    description: 'Gestión de campañas y redes sociales.',
    icon: <Megaphone className="w-6 h-6" />,
    color: 'from-brand-400 to-brand-600',
    columns: ['atl', 'social', 'partners', 'dr', 'editorial', 'tactical'],
    labels: { atl: 'ATL', social: 'Social', partners: 'Partners', dr: 'DR', editorial: 'Editorial', tactical: 'Tactical Act' }
  },
  {
    id: 'development',
    title: 'Desarrollo',
    description: 'Sprint planning, bugs y features.',
    icon: <Code className="w-6 h-6" />,
    color: 'from-emerald-400 to-emerald-600',
    columns: ['frontend', 'backend', 'design', 'qa', 'devops'],
    labels: { frontend: 'Frontend', backend: 'Backend', design: 'Diseño UX/UI', qa: 'QA Testing', devops: 'DevOps' }
  },
  {
    id: 'sales',
    title: 'Ventas CRM',
    description: 'Seguimiento de leads y oportunidades.',
    icon: <Briefcase className="w-6 h-6" />,
    color: 'from-amber-400 to-amber-600',
    columns: ['prospect', 'qualified', 'proposal', 'negotiation', 'closed'],
    labels: { prospect: 'Prospecto', qualified: 'Calificado', proposal: 'Propuesta', negotiation: 'Negociación', closed: 'Cerrado' }
  },
  {
    id: 'hr',
    title: 'Recursos Humanos',
    description: 'Proceso de selección y onboarding.',
    icon: <Users className="w-6 h-6" />,
    color: 'from-pink-400 to-pink-600',
    columns: ['resume', 'interview', 'technical', 'offer', 'hired'],
    labels: { resume: 'CV Revisado', interview: '1ra Entrevista', technical: 'Prueba Técnica', offer: 'Oferta', hired: 'Contratado' }
  },
  {
    id: 'import',
    title: 'Importar archivo',
    description: 'Crea una tabla desde un archivo Excel o CSV.',
    icon: <Upload className="w-6 h-6" />,
    color: 'from-blue-400 to-indigo-600'
  }
];

export default function CreateProjectModal({ onClose, onCreate }: Props) {
  const { isDarkMode } = useTheme();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('blank');
  const [isLoading, setIsLoading] = useState(false);
  const [importedData, setImportedData] = useState<{ columns: string[], labels: Record<string, string>, rows: any[] } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const importRef = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step === 2 && step2Ref.current) {
      setTimeout(() => {
        step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [step]);

  useEffect(() => {
    if (selectedTemplateId === 'import' && importRef.current) {
      setTimeout(() => {
        importRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [selectedTemplateId]);

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
    
    // Detect columns from the first object
    const keys = Object.keys(data[0]);
    const columns = keys.map(k => k.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').substring(0, 40) || `col_${Date.now()}`);
    const labels: Record<string, string> = {};
    keys.forEach((k, i) => {
      labels[columns[i]] = k; // original Excel header as display label
    });

    // Map rows using sanitized keys
    const rows = data.map(item => {
      const newItem: any = {};
      keys.forEach((k, i) => {
        newItem[columns[i]] = item[k] !== undefined && item[k] !== null ? String(item[k]) : '';
      });
      return newItem;
    });

    setImportedData({ columns, labels, rows });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStep(2);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    
    const template = TEMPLATES.find(t => t.id === selectedTemplateId);
    
    let templateData;
    if (selectedTemplateId === 'import' && importedData) {
      templateData = { columns: importedData.columns, labels: importedData.labels };
    } else if (template?.id === 'blank') {
      templateData = { columns: [] as string[], labels: {} as Record<string, string> };
    } else if (template?.columns && template?.labels) {
      templateData = { columns: template.columns, labels: template.labels };
    }

    // Aquí llamaríamos a onCreate. 
    // Ahora pasamos también las filas importadas si existen.
    await onCreate(name.trim(), templateData, importedData?.rows);
    
    // Si hay datos importados, podríamos insertarlos aquí uno por uno si el store no soporta bulk.
    // Pero por UX, es mejor que el store soporte bulk o hacerlo aquí.
    if (selectedTemplateId === 'import' && importedData) {
       // Logic to add rows would go here or be handled by onCreate extension
       console.log("Importing rows:", importedData.rows.length);
    }
    setIsLoading(false);
    onClose();
  };

  const isFormValid = name.trim().length > 0;

  return (
    <div className={`fixed inset-0 z-[100] flex w-full font-sans animate-in slide-in-from-bottom-8 duration-500 ${isDarkMode ? 'bg-[#030305]' : 'bg-white'}`}>
      {/* Left Panel */}
      <div className="flex-1 flex flex-col pt-8 px-8 sm:px-16 lg:px-24 xl:px-32 relative h-full overflow-y-auto">
        <button 
          onClick={onClose}
          className={`absolute top-8 right-8 z-50 flex items-center justify-center w-10 h-10 rounded-full transition-colors ${isDarkMode ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}
        >
          <X className="w-5 h-5" />
        </button>

        {step === 1 ? (
          <div className="w-full max-w-md mt-32 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="mb-12">
              <h1 className={`text-[32px] font-medium leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Comencemos con el nombre<br/>de tu proyecto
              </h1>
            </div>

            <form onSubmit={handleNext} className="space-y-8">
              <div className="relative group">
                <input
                  type="text"
                  autoFocus
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full border-b-2 ${isDarkMode ? 'border-white/10 focus:border-brand-500 text-white' : 'border-slate-200 focus:border-brand-500 text-slate-900'} pb-2 pt-4 bg-transparent text-xl outline-none transition-colors peer placeholder-transparent`}
                  placeholder="Ingresa el nombre de tu proyecto"
                />
                <label className={`absolute left-0 -top-1 text-[13px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} transition-all peer-placeholder-shown:text-xl peer-placeholder-shown:top-3 peer-placeholder-shown:font-normal peer-focus:-top-1 peer-focus:text-[13px] peer-focus:text-brand-500 peer-focus:font-medium pointer-events-none`}>
                  Ingresa el nombre de tu proyecto
                </label>
                
                <div className="mt-4 flex items-center">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-mono border ${isDarkMode ? 'bg-white/5 text-slate-400 border-white/10' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                    {name.trim() ? name.trim().toLowerCase().replace(/\s+/g, '-') + '-id' : 'mi-increible-proyecto-id'}
                  </span>
                </div>
              </div>

              <div className="pt-12 flex items-center justify-between">
                <p className={`text-[11px] leading-tight max-w-[200px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  ¿Ya tienes un proyecto de Google Cloud?<br/>
                  <a href="#" className="text-brand-500 font-medium hover:underline">Agregar NaticBox al proyecto</a>
                </p>

                <button
                  type="submit"
                  disabled={!isFormValid}
                  className={`flex items-center justify-center gap-2 px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
                    isFormValid 
                      ? isDarkMode 
                        ? 'bg-white text-slate-900 hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:-translate-y-0.5' 
                        : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg hover:-translate-y-0.5' 
                      : isDarkMode 
                        ? 'bg-white/5 text-slate-600 cursor-not-allowed' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div 
            ref={step2Ref}
            className="w-full max-w-2xl mt-24 pb-12 animate-in fade-in slide-in-from-right-4 duration-500"
          >
            <button 
              onClick={() => setStep(1)}
              className={`mb-8 flex items-center gap-2 text-sm font-medium transition-colors ${isDarkMode ? 'text-slate-500 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <ArrowLeft className="w-4 h-4" /> Volver
            </button>

            <div className="mb-10">
              <h1 className={`text-[32px] font-medium leading-tight tracking-tight mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Prediseña tu flujo de trabajo
              </h1>
              <p className={`text-[15px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Elige una plantilla para "{name}" o comienza con un lienzo en blanco. 
                Podrás añadir o eliminar columnas más adelante.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-300 ${
                    selectedTemplateId === template.id
                      ? isDarkMode 
                        ? 'bg-brand-500/10 border-brand-500 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-brand-500'
                        : 'bg-brand-50 border-brand-500 shadow-md ring-1 ring-brand-500'
                      : isDarkMode
                        ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br shadow-inner ${template.color} text-white`}>
                    {template.icon}
                  </div>
                  <div>
                    <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {template.title}
                    </h3>
                    <p className={`text-[13px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {template.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {selectedTemplateId === 'import' && (
              <div 
                ref={importRef}
                className={`mb-12 p-8 rounded-[32px] border-2 border-dashed transition-all ${
                importedData 
                  ? (isDarkMode ? 'border-brand-500/50 bg-brand-500/5' : 'border-brand-500/50 bg-brand-50')
                  : (isDarkMode ? 'border-white/10 hover:border-white/20 bg-white/5' : 'border-slate-200 hover:border-slate-300 bg-slate-50')
              }`}>
                {!importedData ? (
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-4 ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                      <Upload className="w-8 h-8 text-brand-500" />
                    </div>
                    <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Subir archivo</h3>
                    <p className={`text-sm mb-6 max-w-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Arrastra tu archivo CSV o Excel aquí para detectar automáticamente las columnas.
                    </p>
                    <input
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className={`px-8 py-2.5 rounded-full text-sm font-semibold cursor-pointer transition-all ${
                        isDarkMode 
                          ? 'bg-white text-slate-900 hover:bg-slate-200 shadow-lg shadow-white/5' 
                          : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg'
                      }`}
                    >
                      Seleccionar archivo
                    </label>
                  </div>
                ) : (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                          <Table className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{fileName}</h3>
                          <p className="text-xs text-slate-500">{importedData.rows.length} filas detectadas</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setImportedData(null); setFileName(null); }}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}
                      >
                        Cambiar archivo
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <p className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        Columnas detectadas
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {importedData.columns.map((col, i) => (
                          <div 
                            key={col}
                            className={`px-3 py-1.5 rounded-xl border text-[13px] font-medium flex items-center gap-2 ${
                              isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5 text-brand-400" />
                            {importedData.labels[col]}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}


            <div className="flex items-center justify-end">
              <button
                onClick={handleCreate}
                disabled={isLoading}
                className={`flex items-center justify-center gap-2 px-10 py-3.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-white text-slate-900 hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:-translate-y-0.5' 
                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg hover:-translate-y-0.5'
                }`}
              >
                {isLoading ? (
                  <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isDarkMode ? 'border-slate-900/30 border-t-slate-900' : 'border-white/30 border-t-white'}`}></div>
                ) : (
                  'Crear Proyecto'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel: Beautiful Dark Decor */}
      <div className="hidden lg:flex w-[45%] xl:w-[35%] bg-[#0f0f13] relative overflow-hidden items-center justify-center rounded-l-[40px] m-4 shadow-2xl">
        <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] bg-brand-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-pink-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
        
        <div className="relative w-full max-w-sm aspect-square">
           <div className="absolute top-[10%] left-[10%] w-[160px] h-[160px] bg-gradient-to-br from-[#2a2a35] to-[#1a1a24] rounded-3xl border border-white/5 shadow-2xl shadow-black/50 p-5 flex flex-col justify-between transform -rotate-6 animate-[float_6s_ease-in-out_infinite]">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                 <Layout className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <div className="w-16 h-1.5 bg-white/10 rounded-full mb-2"></div>
                <div className="w-10 h-1.5 bg-white/5 rounded-full"></div>
              </div>
           </div>

           <div className="absolute top-[40%] right-[10%] w-[180px] h-[180px] bg-gradient-to-br from-[#1a1a24] to-[#0a0a0f] rounded-3xl border border-white/5 shadow-2xl shadow-brand-500/10 p-5 flex flex-col justify-between transform rotate-12 animate-[float_8s_ease-in-out_infinite_reverse]">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
                 <Database className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <div className="w-20 h-1.5 bg-white/20 rounded-full"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-pink-500"></div>
                  <div className="w-12 h-1.5 bg-white/10 rounded-full"></div>
                </div>
              </div>
           </div>

           <div className="absolute bottom-[10%] left-[25%] w-[120px] h-[120px] bg-[#1a1a24]/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-5 flex items-center justify-center transform -rotate-12 animate-[float_7s_ease-in-out_infinite]">
              <div className="w-full h-full rounded-full border-4 border-dashed border-white/10 flex items-center justify-center">
                 <ZapIcon className="w-8 h-8 text-slate-500" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
