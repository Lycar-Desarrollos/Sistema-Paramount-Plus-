import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Filter, Search, LayoutGrid } from 'lucide-react';
import { useContentCalendar } from '../../hooks/marketing/useContentCalendar';
import { useCampaignStore } from '../../store/useCampaignStore';
import { ContentCard } from '../../components/marketing/ContentCard';
import type { ContentStatus } from '../../types/marketing';

const COLUMNS: { id: ContentStatus; title: string; color: string }[] = [
  { id: 'Idea', title: 'Ideas / Brief', color: 'from-slate-500 to-slate-400' },
  { id: 'En Producción', title: 'En Producción', color: 'from-amber-500 to-orange-400' },
  { id: 'En Revisión', title: 'Revisión', color: 'from-brand-500 to-purple-500' },
  { id: 'Aprobado', title: 'Aprobado', color: 'from-emerald-500 to-teal-400' },
  { id: 'Programado', title: 'Programado', color: 'from-sky-500 to-blue-400' },
  { id: 'Publicado', title: 'Publicado', color: 'from-pink-500 to-rose-400' }
];

export default function ContentPipeline({ isDarkMode = true }: { isDarkMode?: boolean }) {
  const activeProjectId = useCampaignStore(state => state.activeProjectId);
  const { items, loading, updateStatus } = useContentCalendar(activeProjectId);

  const onDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === result.source.droppableId) return;

    updateStatus(draggableId, destination.droppableId as ContentStatus);
  };

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Cargando Pipeline...</div>;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Sub Header */}
      <div className={`px-8 py-4 border-b flex items-center justify-between ${isDarkMode ? 'bg-[#0a0a0f]/50 border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-4">
           <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold ${isDarkMode ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900'}`}>
              <LayoutGrid className="w-4 h-4 text-brand-400" /> Content Kanban
           </div>
           <button className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><Filter className="w-4 h-4" /></button>
        </div>
         <div className="flex items-center gap-3">
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
               <input 
                  type="text" 
                  placeholder="Filtrar contenido..." 
                  className={`border rounded-lg pl-9 pr-4 py-1.5 text-xs outline-none focus:border-brand-500 transition-all ${
                     isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`} 
               />
            </div>
           <button className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-bold hover:bg-brand-600 transition-all">
              <Plus className="w-3 h-3" /> Nuevo Contenido
           </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-8">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full items-start min-w-max">
            {COLUMNS.map((column) => (
              <div key={column.id} className="w-[320px] flex flex-col h-full max-h-full">
                <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${column.color}`}></div>
                      <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{column.title}</h3>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isDarkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-500'}`}>
                        {items.filter(i => i.status === column.id).length}
                      </span>
                    </div>
                  <MoreHorizontal className="w-4 h-4 text-slate-600 cursor-pointer" />
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 overflow-y-auto rounded-2xl p-2 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-brand-500/5' : 'bg-transparent'
                      }`}
                    >
                      <div className="space-y-4">
                        {items
                          .filter(i => i.status === column.id)
                          .map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <ContentCard item={item} isDarkMode={isDarkMode} />
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
