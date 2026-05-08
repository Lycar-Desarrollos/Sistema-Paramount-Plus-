import React, { useState } from 'react';
import { Sparkles, ShieldAlert, CheckCircle2, Layout, Database, Zap as ZapIcon, ArrowUpRight, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isResetMode, setIsResetMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isResetMode) {
        if (!email) throw new Error("Por favor ingresa tu correo para restablecer la contraseña.");
        await sendPasswordResetEmail(auth, email);
        setMessage("Te hemos enviado un enlace para restablecer tu contraseña. Revisa tu correo.");
        setIsResetMode(false);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error durante la autenticación.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = isResetMode ? email.length > 0 : email.length > 0 && password.length > 0;

  return (
    <div className={`min-h-screen flex w-full font-sans transition-colors duration-500 ${isDarkMode ? 'bg-[#030305]' : 'bg-white'}`}>
      
      {/* Left Panel: Form */}
      <div className="flex-1 flex flex-col pt-8 px-8 sm:px-16 lg:px-24 xl:px-32 relative">
        <div className="w-full max-w-md mt-12">
          
          {/* Logo and Theme Toggle */}
          <div className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[10px] bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                NaticBox
              </span>
            </div>
            
            <button 
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10' : 'bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
              title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="mb-12">
            <h1 className={`text-[32px] font-medium leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {isResetMode ? 'Restablece tu contraseña' : 'Comencemos con tu cuenta'}
            </h1>
            {!isResetMode && (
              <p className={`mt-3 text-[15px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Ingresa tus credenciales para acceder a tu espacio de trabajo.
              </p>
            )}
          </div>

          {error && (
            <div className={`mb-8 p-4 rounded-xl border flex items-start gap-3 text-sm ${isDarkMode ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-100 text-red-600'}`}>
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {message && (
            <div className={`mb-8 p-4 rounded-xl border flex items-start gap-3 text-sm ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="relative group">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full border-b-2 ${isDarkMode ? 'border-white/10 focus:border-brand-500 text-white' : 'border-slate-200 focus:border-brand-500 text-slate-900'} pb-2 pt-4 bg-transparent text-lg outline-none transition-colors peer placeholder-transparent`}
                placeholder="Ingresa tu correo electrónico"
              />
              <label className={`absolute left-0 -top-1 text-[13px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} transition-all peer-placeholder-shown:text-lg peer-placeholder-shown:top-3 peer-placeholder-shown:font-normal peer-focus:-top-1 peer-focus:text-[13px] peer-focus:text-brand-500 peer-focus:font-medium pointer-events-none`}>
                Ingresa tu correo electrónico
              </label>
            </div>

            {!isResetMode && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    required={!isResetMode}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full border-b-2 ${isDarkMode ? 'border-white/10 focus:border-brand-500 text-white' : 'border-slate-200 focus:border-brand-500 text-slate-900'} pb-2 pt-4 bg-transparent text-lg outline-none transition-colors peer placeholder-transparent pr-10`}
                    placeholder="Contraseña"
                  />
                  <label className={`absolute left-0 -top-1 text-[13px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} transition-all peer-placeholder-shown:text-lg peer-placeholder-shown:top-3 peer-placeholder-shown:font-normal peer-focus:-top-1 peer-focus:text-[13px] peer-focus:text-brand-500 peer-focus:font-medium pointer-events-none`}>
                    Contraseña
                  </label>
                  
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-0 top-3 p-1.5 rounded-md ${isDarkMode ? 'text-slate-500 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'} transition-colors`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="flex justify-end pt-1">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsResetMode(true);
                      setError(null);
                      setMessage(null);
                    }}
                    className="text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-between">
              {!isResetMode ? (
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  ¿No tienes cuenta? <a href="#" className="text-brand-500 font-medium hover:underline">Contacta al admin</a>
                </p>
              ) : (
                <button 
                  type="button"
                  onClick={() => setIsResetMode(false)}
                  className={`text-xs font-medium ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'} transition-colors`}
                >
                  Volver a iniciar sesión
                </button>
              )}

              <button
                type="submit"
                disabled={!isFormValid || isLoading}
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
                {isLoading ? (
                  <div className={`w-4 h-4 border-2 rounded-full animate-spin ${isDarkMode ? 'border-slate-900/30 border-t-slate-900' : 'border-white/30 border-t-white'}`}></div>
                ) : (
                  <>
                    Continuar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        
        {/* Footer Links */}
        <div className={`absolute bottom-8 left-8 sm:left-16 lg:left-24 xl:left-32 flex items-center gap-6 text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          <a href="#" className={`transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-slate-600'}`}>Términos</a>
          <a href="#" className={`transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-slate-600'}`}>Privacidad</a>
          <a href="#" className={`transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-slate-600'}`}>Documentación <ArrowUpRight className="w-3 h-3 inline pb-0.5" /></a>
        </div>
      </div>

      {/* Right Panel: Beautiful Dark Decor */}
      <div className="hidden lg:flex w-[45%] xl:w-[50%] bg-[#0f0f13] relative overflow-hidden items-center justify-center rounded-l-[40px] m-4 shadow-2xl">
        {/* Gradients */}
        <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] bg-brand-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-pink-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
        
        {/* Floating Abstract Cards */}
        <div className="relative w-full max-w-lg aspect-square">
           
           {/* Card 1 */}
           <div className="absolute top-[10%] left-[10%] w-[200px] h-[200px] bg-gradient-to-br from-[#2a2a35] to-[#1a1a24] rounded-3xl border border-white/5 shadow-2xl shadow-black/50 p-6 flex flex-col justify-between transform -rotate-6 animate-[float_6s_ease-in-out_infinite]">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                 <Layout className="w-6 h-6 text-brand-400" />
              </div>
              <div>
                <div className="w-20 h-2 bg-white/10 rounded-full mb-2"></div>
                <div className="w-12 h-2 bg-white/5 rounded-full"></div>
              </div>
           </div>

           {/* Card 2 */}
           <div className="absolute top-[40%] right-[10%] w-[220px] h-[220px] bg-gradient-to-br from-[#1a1a24] to-[#0a0a0f] rounded-3xl border border-white/5 shadow-2xl shadow-brand-500/10 p-6 flex flex-col justify-between transform rotate-12 animate-[float_8s_ease-in-out_infinite_reverse]">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
                 <Database className="w-7 h-7 text-white" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <div className="w-24 h-2 bg-white/20 rounded-full"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                  <div className="w-16 h-2 bg-white/10 rounded-full"></div>
                </div>
              </div>
           </div>

           {/* Card 3 */}
           <div className="absolute bottom-[10%] left-[25%] w-[160px] h-[160px] bg-[#1a1a24]/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6 flex items-center justify-center transform -rotate-12 animate-[float_7s_ease-in-out_infinite]">
              <div className="w-full h-full rounded-full border-4 border-dashed border-white/10 flex items-center justify-center">
                 <ZapIcon className="w-10 h-10 text-slate-500" />
              </div>
           </div>
           
        </div>
      </div>
    </div>
  );
}
