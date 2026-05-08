import React from 'react';
import { MessageSquare, Paperclip, Clock, CheckCircle2, User } from 'lucide-react';
import type { ContentItem, Platform } from '../../types/marketing';
import { motion } from 'framer-motion';

const PLATFORM_ICONS: Record<Platform, string> = {
  'Instagram': '📸',
  'Facebook': '👥',
  'TikTok': '🎵',
  'LinkedIn': '💼',
  'Twitter/X': '🐦',
  'YouTube': '🎥',
  'Google Ads': '🔍',
  'Email': '📧',
  'Blog': '📝',
  'Podcast': '🎙️'
};

interface ContentCardProps {
  item: ContentItem;
  isDarkMode?: boolean;
  onClick?: () => void;
}

export const ContentCard: React.FC<ContentCardProps> = ({ item, isDarkMode = true, onClick }) => {
  return (
    <motion.div
      layoutId={item.id}
      onClick={onClick}
      className={`group p-4 rounded-2xl border transition-all cursor-pointer ${
        isDarkMode 
          ? 'bg-[#1a1a24] border-white/5 hover:border-brand-500/50 hover:shadow-2xl hover:shadow-brand-500/10' 
          : 'bg-white border-slate-200 hover:border-brand-500 hover:shadow-lg'
      }`}
    >
      {/* Platform Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {item.platforms?.map(p => (
          <span key={p} className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
            isDarkMode ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}>
            {PLATFORM_ICONS[p]} {p}
          </span>
        ))}
      </div>

      <h4 className={`font-bold text-[15px] mb-3 leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
        {item.title}
      </h4>

      {/* Asset Preview Placeholder if attachment exists */}
      {item.attachments && item.attachments.length > 0 && (
        <div className="w-full h-32 rounded-xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 mb-4 flex items-center justify-center overflow-hidden relative border border-white/5">
           <img src={item.attachments[0].url} alt={item.title} className="w-full h-full object-cover opacity-60" />
           <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
        </div>
      )}

      {/* Footer Info */}
      <div className={`flex items-center justify-between pt-3 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{item.publishDate ? new Date(item.publishDate.toDate()).toLocaleDateString() : 'Sin fecha'}</span>
          </div>
          {item.status === 'Aprobado' && (
            <div className="flex items-center gap-1 text-emerald-500">
              <CheckCircle2 className="w-3 h-3" />
              <span>Aprobado</span>
            </div>
          )}
        </div>
        
        <div className="flex -space-x-1.5">
           <div className={`w-6 h-6 rounded-full bg-brand-500 border-2 flex items-center justify-center text-[10px] font-bold text-white ${isDarkMode ? 'border-[#1a1a24]' : 'border-white'}`}>
              {item.copywriter?.charAt(0) || 'U'}
           </div>
        </div>
      </div>
    </motion.div>
  );
};
