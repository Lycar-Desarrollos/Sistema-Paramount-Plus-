import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Settings, 
  Users, 
  Bell, 
  Languages, 
  Palette, 
  TrendingUp, 
  Share2, 
  Link as LinkIcon, 
  Trash2, 
  LogOut, 
  ChevronRight,
  ShieldCheck,
  CreditCard,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface UserMenuProps {
  user: any;
  userData: any;
  isDarkMode: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, userData, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  const menuItems = [
    { icon: User, label: 'Cuenta', section: 'personal' },
    { icon: Users, label: 'Gestionar grupos', badge: 'Business', section: 'personal' },
    { icon: Bell, label: 'Preferencias de notificación', hasArrow: true, section: 'personal' },
    { icon: Languages, label: 'Preferencias de idioma', hasArrow: true, section: 'personal' },
    { icon: Palette, label: 'Aspecto', badge: 'Beta', section: 'personal' },
    
    { icon: MessageCircle, label: 'Comunicarse con Ventas', section: 'action' },
    { icon: TrendingUp, label: 'Mejorar', section: 'action' },
    { icon: Share2, label: 'Cuéntale a un amigo', section: 'action' },
    
    { icon: LinkIcon, label: 'Integraciones', section: 'system' },
    { icon: ShieldCheck, label: 'Centro de creadores', section: 'system' },
    
    { icon: Trash2, label: 'Papelera de reciclaje', section: 'footer' },
    { icon: LogOut, label: 'Cerrar sesión', onClick: handleLogout, section: 'footer', color: 'text-red-400' },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 group transition-all"
      >
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <p className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {user.displayName || 'Edgar Ydalimir'}
            </p>
            <p className="text-[10px] text-slate-400 max-w-[120px] truncate">{user.email}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-pink-500 text-white flex items-center justify-center text-sm font-bold border-2 border-white/10 shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform cursor-pointer">
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`absolute right-0 mt-3 w-72 rounded-2xl shadow-2xl overflow-hidden z-[100] border ${
              isDarkMode 
                ? 'bg-[#13131a]/95 backdrop-blur-xl border-white/10' 
                : 'bg-white/95 backdrop-blur-xl border-slate-200'
            }`}
          >
            {/* Header / Profile Info */}
            <div className={`p-5 border-b ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-pink-500 flex items-center justify-center text-xl font-bold text-white shadow-inner">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {user.displayName || 'Edgar Ydalimir'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Menu Sections */}
            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar p-2 space-y-1">
              {['personal', 'action', 'system', 'footer'].map((section, idx, arr) => (
                <div key={section}>
                  {menuItems.filter(item => item.section === section).map((item, i) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        if (item.onClick) item.onClick();
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        isDarkMode 
                          ? 'hover:bg-white/5 text-slate-300 hover:text-white' 
                          : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                      } ${item.color || ''}`}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 text-sm font-medium text-left">{item.label}</span>
                      
                      {item.badge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          item.badge === 'Business' 
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      
                      {item.hasArrow && <ChevronRight className="w-4 h-4 text-slate-500" />}
                    </button>
                  ))}
                  {idx < arr.length - 1 && (
                    <div className={`my-1 mx-2 h-px ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
