import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { MoreHorizontal, Plus, MessageSquare, Paperclip, GripVertical, AlertCircle, ChevronRight, User } from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCampaignStore } from '../store/useCampaignStore';

// Mock Avatars para darle el toque premium colaborativo
const AVATARS = [
  'https://i.pravatar.cc/150?img=68',
  'https://i.pravatar.cc/150?img=32',
  'https://i.pravatar.cc/150?img=47',
];

const INITIAL_DATA = {
  tasks: {
    'task-1': { id: 'task-1', content: 'Summer Collection Ad', image: 'gradient-pink', tag: 'Social Media', comments: 3, attachments: 2, dueDate: 'Tomorrow', assignees: [AVATARS[0], AVATARS[1]], priority: 'High' },
    'task-2': { id: 'task-2', content: 'Brand Guidelines v2.0', image: null, tag: 'Branding', comments: 8, attachments: 5, dueDate: 'In 3 days', assignees: [AVATARS[2]], priority: 'Medium' },
    'task-3': { id: 'task-3', content: 'Product Launch Video', image: 'gradient-brand', tag: 'Video', comments: 12, attachments: 1, dueDate: 'Next Week', assignees: [AVATARS[1], AVATARS[2]], priority: 'High' },
    'task-4': { id: 'task-4', content: 'Email Template Refresh', image: 'gradient-emerald', tag: 'Marketing', comments: 1, attachments: 0, dueDate: 'Today', assignees: [AVATARS[0]], priority: 'Low' },
  },
  columns: {
    'col-1': { id: 'col-1', title: 'Backlog / Ideas', taskIds: ['task-1', 'task-2'], color: 'from-slate-500 to-slate-400' },
    'col-2': { id: 'col-2', title: 'In Production', taskIds: ['task-3'], color: 'from-brand-500 to-purple-500' },
    'col-3': { id: 'col-3', title: 'Review & Approval', taskIds: ['task-4'], color: 'from-pink-500 to-rose-400' },
  },
  columnOrder: ['col-1', 'col-2', 'col-3'],
};

interface KanbanBoardProps {
  isDarkMode?: boolean;
}

export default function KanbanBoard({ isDarkMode = true }: KanbanBoardProps) {
  const [data, setData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeProjectId = useCampaignStore(state => state.activeProjectId);

  useEffect(() => {
    if (!activeProjectId) return;
    setLoading(true);
    const docRef = doc(db, 'boards', activeProjectId);
    
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const dbData = docSnap.data() as typeof INITIAL_DATA;
          setData({
            ...dbData,
            tasks: dbData.tasks || INITIAL_DATA.tasks,
            columns: dbData.columns || INITIAL_DATA.columns,
            columnOrder: dbData.columnOrder || INITIAL_DATA.columnOrder
          });
        } else {
          setDoc(docRef, INITIAL_DATA);
          setData(INITIAL_DATA);
        }
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error("Firestore error:", error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeProjectId]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const start = data.columns[source.droppableId as keyof typeof data.columns];
    const finish = data.columns[destination.droppableId as keyof typeof data.columns];

    let newData = { ...data };

    if (start === finish) {
      const newTaskIds = Array.from(start.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = { ...start, taskIds: newTaskIds };
      newData = { ...data, columns: { ...data.columns, [newColumn.id]: newColumn } };
    } else {
      const startTaskIds = Array.from(start.taskIds);
      startTaskIds.splice(source.index, 1);
      const newStart = { ...start, taskIds: startTaskIds };

      const finishTaskIds = Array.from(finish.taskIds);
      finishTaskIds.splice(destination.index, 0, draggableId);
      const newFinish = { ...finish, taskIds: finishTaskIds };

      newData = {
        ...data,
        columns: {
          ...data.columns,
          [newStart.id]: newStart,
          [newFinish.id]: newFinish,
        },
      };
    }

    setData(newData);
    if (activeProjectId) {
      await setDoc(doc(db, 'boards', activeProjectId), newData);
    }
  };

  const handleAddCard = async (columnId: string) => {
    const newTaskId = `task-${Date.now()}`;
    const newTask = {
      id: newTaskId,
      content: 'Nueva Tarea Automática',
      image: null,
      tag: 'Marketing',
      comments: 0,
      attachments: 0,
      dueDate: 'Sin fecha',
      assignees: [AVATARS[Math.floor(Math.random() * AVATARS.length)]],
      priority: 'Medium'
    };

    const column = data.columns[columnId as keyof typeof data.columns];
    const newTaskIds = [...column.taskIds, newTaskId];

    const newData = {
      ...data,
      tasks: { ...data.tasks, [newTaskId]: newTask },
      columns: { ...data.columns, [columnId]: { ...column, taskIds: newTaskIds } }
    };

    setData(newData);
    if (activeProjectId) {
      await setDoc(doc(db, 'boards', activeProjectId), newData);
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'Social Media': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'Branding': return 'bg-brand-500/10 text-brand-400 border-brand-500/20';
      case 'Video': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Marketing': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'High': return <AlertCircle className="w-3.5 h-3.5 text-rose-400" />;
      case 'Medium': return <ChevronRight className="w-3.5 h-3.5 text-amber-400 rotate-[-90deg]" />;
      case 'Low': return <ChevronRight className="w-3.5 h-3.5 text-emerald-400 rotate-90" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center flex-col gap-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className={`text-sm animate-pulse ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Cargando tablero...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`h-full flex flex-col p-8 overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-[#030305]' : 'bg-slate-50'}`}>
        <div className="max-w-md mx-auto mt-20 p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-center backdrop-blur-xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Error de conexión</h3>
          <p className="text-sm text-slate-400 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-[#030305]' : 'bg-slate-50'}`}>
      
      {/* Panel Superior Premium */}
      <div className={`px-8 py-6 border-b flex items-center justify-between backdrop-blur-md sticky top-0 z-10 ${
        isDarkMode ? 'bg-[#0a0a0f]/80 border-white/5' : 'bg-white/80 border-slate-200'
      }`}>
        <div>
          <h2 className={`text-2xl font-bold tracking-tight mb-1 bg-gradient-to-r bg-clip-text text-transparent ${
            isDarkMode ? 'from-white to-slate-400' : 'from-slate-900 to-slate-500'
          }`}>Automatizaciones</h2>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Gestión visual de flujos y estados.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 mr-4">
            {AVATARS.map((src, i) => (
              <img key={i} src={src} alt="Miembro del equipo" className={`w-8 h-8 rounded-full border-2 object-cover ${isDarkMode ? 'border-[#0a0a0f]' : 'border-white'}`} />
            ))}
            <div className={`w-8 h-8 rounded-full border-2 bg-brand-500 flex items-center justify-center text-xs font-bold text-white ${isDarkMode ? 'border-[#0a0a0f]' : 'border-white'}`}>
              +3
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-xl hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/25">
            <Plus className="w-4 h-4" /> Crear Tablero
          </button>
        </div>
      </div>

      {/* Área del Tablero */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full p-8 items-start w-max">
            {data.columnOrder.map((columnId) => {
              const column = data.columns[columnId as keyof typeof data.columns];
              if (!column) return null;
              
              const tasks = column.taskIds
                .map(taskId => data.tasks[taskId as keyof typeof data.tasks])
                .filter(Boolean);

              return (
                <div 
                  key={column.id} 
                  className={`flex flex-col h-full max-h-full w-[340px] rounded-2xl flex-shrink-0 transition-all duration-300 ${
                    isDarkMode ? 'bg-[#13131a]/80 backdrop-blur-xl border border-white/5 shadow-2xl' : 'bg-slate-100/80 backdrop-blur-xl border border-slate-200'
                  }`}
                >
                  {/* Cabecera de Columna */}
                  <div className="p-4 flex items-center justify-between border-b border-white/5 relative overflow-hidden rounded-t-2xl">
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${column.color}`}></div>
                    <div className="flex items-center gap-3">
                      <h3 className={`font-bold text-[15px] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{column.title}</h3>
                      <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        isDarkMode ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {tasks.length}
                      </div>
                    </div>
                    <button className={`p-1.5 rounded-lg transition-colors ${
                      isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                    }`}>
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Área Soltable (Droppable) */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto p-4 min-h-[150px] transition-colors ${
                          snapshot.isDraggingOver ? (isDarkMode ? 'bg-white/[0.02]' : 'bg-slate-200/50') : 'bg-transparent'
                        }`}
                      >
                        <div className="space-y-4">
                          {tasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`group relative p-4 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing ${
                                    snapshot.isDragging 
                                      ? (isDarkMode ? `bg-[#1e1e28] border-brand-500 shadow-2xl shadow-brand-500/20 rotate-3 z-50` : `bg-white border-brand-500 shadow-2xl shadow-brand-500/20 rotate-3 z-50`)
                                      : (isDarkMode ? 'bg-[#1a1a24] border-white/5 hover:border-white/20 hover:shadow-lg hover:-translate-y-0.5' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5')
                                  }`}
                                >
                                  {/* Icono de Arrastrar oculto hasta el hover */}
                                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white/10 rounded backdrop-blur-md shadow-sm">
                                    <GripVertical className="w-3 h-3 text-slate-400" />
                                  </div>

                                  {/* Imagen Cover si la hay */}
                                  {task.image && (
                                    <div className={`w-full h-32 rounded-lg overflow-hidden mb-4 relative ${
                                      task.image === 'gradient-pink' ? 'bg-gradient-to-br from-pink-500 to-rose-400' :
                                      task.image === 'gradient-brand' ? 'bg-gradient-to-br from-brand-500 to-purple-600' :
                                      task.image === 'gradient-emerald' ? 'bg-gradient-to-br from-emerald-400 to-teal-500' :
                                      'bg-slate-800'
                                    }`}>
                                      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </div>
                                  )}

                                  {/* Etiquetas y Prioridad */}
                                  <div className="flex items-center justify-between mb-3">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${getTagColor(task.tag)}`}>
                                      {task.tag}
                                    </span>
                                    <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md border border-white/5" title={`Prioridad: ${task.priority}`}>
                                      {getPriorityIcon(task.priority || 'Medium')}
                                    </div>
                                  </div>

                                  {/* Título de Tarea */}
                                  <p className={`text-[15px] font-semibold mb-4 leading-snug ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                    {task.content}
                                  </p>

                                  {/* Footer: Comentarios, Archivos y Avatares */}
                                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                    <div className="flex items-center gap-3 text-slate-400 text-xs font-medium">
                                      <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        <span>{task.comments}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                                        <Paperclip className="w-3.5 h-3.5" />
                                        <span>{task.attachments}</span>
                                      </div>
                                    </div>

                                    {/* Avatares superpuestos */}
                                    <div className="flex items-center">
                                      {task.assignees?.length > 0 ? (
                                        <div className="flex -space-x-1.5">
                                          {task.assignees.map((avatar, idx) => (
                                            <img 
                                              key={idx} 
                                              src={avatar} 
                                              alt="Assignee" 
                                              className={`w-6 h-6 rounded-full border-2 object-cover ${isDarkMode ? 'border-[#1a1a24]' : 'border-white'}`} 
                                            />
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                                          <User className="w-3 h-3" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>

                        {/* Botón de Añadir Tarjeta */}
                        <button 
                          onClick={() => handleAddCard(column.id)}
                          className={`mt-4 w-full py-3.5 rounded-xl border border-dashed flex items-center justify-center gap-2 text-sm font-medium transition-all group ${
                            isDarkMode 
                              ? 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/20' 
                              : 'border-slate-300 text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-400'
                          }`}
                        >
                          <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          Añadir tarjeta
                        </button>
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
            
            {/* Añadir Nueva Columna */}
            <div className={`w-[340px] flex-shrink-0 flex items-center justify-center h-[120px] rounded-2xl border-2 border-dashed transition-colors cursor-pointer group ${
              isDarkMode ? 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
            }`}>
              <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-brand-400 transition-colors">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-500/10">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">Nueva Lista</span>
              </div>
            </div>
            
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
