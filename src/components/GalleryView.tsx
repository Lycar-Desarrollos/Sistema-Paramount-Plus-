import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Heart, Share2, MoreVertical, Filter, Grid3X3, List } from 'lucide-react';

const MOCK_ASSETS = [
  { id: 1, title: 'Summer Sale Hero', type: 'Image', size: '2.4 MB', date: '2h ago', color: 'from-pink-500 to-rose-400' },
  { id: 2, title: 'Product Showcase', type: 'Video', size: '15 MB', date: '5h ago', color: 'from-brand-500 to-purple-600' },
  { id: 3, title: 'Brand Pattern', type: 'Vector', size: '800 KB', date: '1d ago', color: 'from-emerald-400 to-teal-500' },
  { id: 4, title: 'Instagram Story 1', type: 'Image', size: '1.2 MB', date: '2d ago', color: 'from-amber-400 to-orange-500' },
  { id: 5, title: 'App Mockup UI', type: 'Figma', size: '5.6 MB', date: '3d ago', color: 'from-sky-400 to-blue-600' },
  { id: 6, title: 'Abstract Background', type: 'Image', size: '3.1 MB', date: '1w ago', color: 'from-violet-500 to-fuchsia-600' },
];

export default function GalleryView({ isDarkMode = true }: { isDarkMode?: boolean }) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'Images', 'Videos', 'Vectors', 'Figma'];

  return (
    <div className="space-y-6">
      {/* Gallery Controls */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl ${isDarkMode ? 'glass-panel' : 'bg-white shadow-sm border border-slate-200'}`}>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {filters.map(filter => (
            <button 
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeFilter === filter 
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' 
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
            <Filter size={16} /> Filters
          </button>
          <div className="h-6 w-px bg-white/10 mx-1"></div>
          <div className="flex bg-white/5 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Grid3X3 size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_ASSETS.map((asset, index) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            key={asset.id}
            className="group relative rounded-2xl overflow-hidden glass-card aspect-[4/3] cursor-pointer"
          >
            {/* Image Replacement with Gradient */}
            <div className={`w-full h-full transition-transform duration-700 group-hover:scale-105 bg-gradient-to-br ${asset.color}`}>
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
            </div>
            
            {/* Top Overlay Actions */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 bg-gradient-to-b from-black/60 to-transparent">
              <span className="bg-black/50 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/10">
                {asset.type}
              </span>
              <button className="p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-brand-500 hover:text-white transition-colors border border-white/10">
                <Heart size={14} />
              </button>
            </div>

            {/* Bottom Overlay Info */}
            <div className="absolute bottom-0 left-0 w-full p-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <h3 className="text-lg font-bold text-white leading-tight mb-1">{asset.title}</h3>
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                <span>{asset.size} • Added {asset.date}</span>
              </div>
              
              {/* Action Buttons (visible on hover) */}
              <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                <button className="flex-1 bg-white/10 hover:bg-brand-500 text-white py-2 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm border border-white/10 flex items-center justify-center gap-2">
                  <Download size={14} /> Download
                </button>
                <button className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-sm border border-white/10">
                  <Share2 size={16} />
                </button>
                <button className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-sm border border-white/10">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
