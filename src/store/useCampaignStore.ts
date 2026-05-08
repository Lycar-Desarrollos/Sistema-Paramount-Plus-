import { create } from 'zustand';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, query, where, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface Project {
  id: string;
  name: string;
  createdAt: number;
}

export interface Table {
  id: string;
  projectId: string;
  name: string;
  columns: string[];
  columnLabels: Record<string, string>;
  createdAt: number;
  favoriteBy?: string[];
}

export interface Campaign {
  id: string;
  projectId: string;
  tableId: string;
  title: string;
  category: string | null;
  [key: string]: any; // Allow dynamic column keys
  createdAt: number;
}

export const DEFAULT_CATEGORIES = ['Priority (L)', 'Moderate (M)', 'Tentpole (XL)', 'Social Media', 'Branding'];

export const DEFAULT_COLUMNS = ['atl', 'social', 'partners', 'dr', 'pluto', 'linear', 'editorial', 'tmo', 'tactical'];

export const DEFAULT_LABELS: Record<string, string> = {
  title: 'Title Name',
  category: 'Category',
  atl: 'ATL',
  social: 'Social',
  partners: 'Partners',
  dr: 'DR',
  pluto: 'Pluto',
  linear: 'Linear',
  editorial: 'Editorial',
  tmo: 'TMO',
  tactical: 'Tactical Act',
};

interface CampaignStore {
  activeProjectId: string;
  activeTableId: string;
  setActiveProjectId: (id: string) => void;
  setActiveTableId: (id: string) => void;
  projects: Project[];
  tables: Table[];
  campaigns: Campaign[];
  columns: string[];
  columnLabels: Record<string, string>;
  loading: boolean;
  error: string | null;
  initializeGlobal: (user: any, userData: any) => () => void; 
  initializeProjectData: (projectId: string) => () => void; 
  initializeTableData: (tableId: string) => () => void;
  addProject: (name: string, template?: { columns: string[], labels: Record<string, string> }) => Promise<void>;
  addTable: (projectId: string, name: string, template?: { columns: string[], labels: Record<string, string> }) => Promise<void>;
  updateTable: (id: string, name: string) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  addCampaign: () => Promise<void>;
  updateCampaignField: (id: string, field: string, value: any) => Promise<void>;
  updateColumnLabel: (field: string, label: string) => Promise<void>;
  deleteCampaigns: (ids: string[]) => Promise<void>;
  addColumn: (name: string) => Promise<void>;
  deleteColumn: (id: string) => Promise<void>;
  updateProjectName: (id: string, newName: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addMemberToProject: (projectId: string, email: string) => Promise<void>;
  removeMemberFromProject: (projectId: string, email: string) => Promise<void>;
  toggleFavoriteProject: (projectId: string, email: string) => Promise<void>;
  importRows: (projectId: string, tableId: string, rows: any[]) => Promise<void>;
  toggleTableFavorite: (tableId: string) => Promise<void>;
  isProMode: boolean;
  setIsProMode: (val: boolean) => void;
}

export const useCampaignStore = create<CampaignStore>((set, get) => ({
  activeProjectId: 'lat-br', 
  activeTableId: '',
  setActiveProjectId: (id: string) => {
    set({ activeProjectId: id, loading: true });
  },
  setActiveTableId: (id: string) => {
    set({ activeTableId: id, loading: true });
  },
  projects: [],
  tables: [],
  campaigns: [],
  columns: DEFAULT_COLUMNS,
  columnLabels: DEFAULT_LABELS,
  loading: false,
  error: null,
  isProMode: false,
  setIsProMode: (val: boolean) => set({ isProMode: val }),

  initializeGlobal: (user: any, userData: any) => {
    const unsubProjects = onSnapshot(collection(db, 'workspaces'), (snapshot) => {
      let fetchedProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      
      // Filter projects based on role
      if (userData?.role === 'colaborador' || userData?.role === 'cliente') {
        const userEmail = user?.email?.toLowerCase();
        fetchedProjects = fetchedProjects.filter(p => {
          // Si es dueño original (por uid) o está en la lista de memberEmails
          const isOwner = p.members && p.members[user?.uid];
          const isMember = p.memberEmails && p.memberEmails.includes(userEmail);
          return isOwner || isMember;
        });
      }
      
      const sorted = fetchedProjects.sort((a, b) => a.createdAt - b.createdAt);
      set({ projects: sorted, loading: false });

      if (sorted.length === 0 && userData?.role === 'admin') {
        get().addProject('Campaign Tracker - LAT & BR');
      } else if (sorted.length > 0) {
        if (!sorted.find(p => p.id === get().activeProjectId)) {
          set({ activeProjectId: sorted[0].id });
        }
      }
    });

    return unsubProjects;
  },

  initializeProjectData: (projectId: string) => {
    // Only set loading if we don't have tables for this project yet
    if (get().tables.length === 0) set({ loading: true });
    
    const qTables = query(collection(db, 'tables'), where('projectId', '==', projectId));
    const unsubTables = onSnapshot(qTables, (snapshot) => {
      const fetchedTables = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Table[];
      
      const sorted = fetchedTables.sort((a, b) => a.createdAt - b.createdAt);
      set({ tables: sorted });

      if (sorted.length === 0) {
        get().addTable(projectId, 'Table 1');
      } else {
        const currentActive = get().activeTableId;
        const firstTableId = sorted[0].id;
        
        if (currentActive !== firstTableId && !sorted.find(t => t.id === currentActive)) {
          set({ activeTableId: firstTableId });
        } else {
          // If we already have the correct table active, we might need to clear loading
          // if initializeTableData isn't going to be triggered by App.tsx
          set({ loading: false });
        }
      }
    });

    return unsubTables;
  },

  initializeTableData: (tableId: string) => {
    set({ loading: true });
    
    const unsubTable = onSnapshot(doc(db, 'tables', tableId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        set({ 
          columnLabels: { ...DEFAULT_LABELS, ...(data.columnLabels || {}) },
          columns: data.columns || DEFAULT_COLUMNS
        });
      }
    });

    const qRecords = query(collection(db, 'campaigns'), where('tableId', '==', tableId));
    const unsubRecords = onSnapshot(qRecords, (snapshot) => {
      const fetchedData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Campaign[];
      fetchedData.sort((a,b) => b.createdAt - a.createdAt);
      set({ campaigns: fetchedData, loading: false, error: null });
    }, (error) => {
      console.error('Firestore Error:', error);
      set({ error: error.message, loading: false });
    });

    return () => {
      unsubTable();
      unsubRecords();
    };
  },

  addProject: async (name: string, template?: { columns: string[], labels: Record<string, string> }) => {
    try {
      const user = auth.currentUser;
      const newRef = await addDoc(collection(db, 'workspaces'), {
        name,
        createdAt: Date.now(),
        members: user ? { [user.uid]: 'owner' } : {},
        memberEmails: user && user.email ? [user.email.toLowerCase()] : []
      });
      
      if (template) {
        await get().addTable(newRef.id, 'Main Table', template);
      } else {
        await get().addTable(newRef.id, 'Table 1');
      }
      
      set({ activeProjectId: newRef.id });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addTable: async (projectId: string, name: string, template?: { columns: string[], labels: Record<string, string> }, initialRows?: any[]) => {
    try {
      const newRef = await addDoc(collection(db, 'tables'), {
        projectId,
        name,
        columns: template?.columns || DEFAULT_COLUMNS,
        columnLabels: template?.labels || DEFAULT_LABELS,
        createdAt: Date.now()
      });
      set({ activeTableId: newRef.id });

      // If we have initial rows, add them
      if (initialRows && initialRows.length > 0) {
        const promises = initialRows.map(row => 
          addDoc(collection(db, 'campaigns'), {
            ...row,
            projectId,
            tableId: newRef.id,
            createdAt: Date.now()
          })
        );
        await Promise.all(promises);
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateTable: async (id: string, name: string) => {
    try {
      await updateDoc(doc(db, 'tables', id), { name });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteTable: async (id: string) => {
    try {
      const { tables, activeTableId } = get();
      await deleteDoc(doc(db, 'tables', id));
      if (activeTableId === id) {
        const remaining = tables.filter(t => t.id !== id);
        if (remaining.length > 0) set({ activeTableId: remaining[0].id });
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addCampaign: async () => {
    const { activeProjectId, activeTableId } = get();
    const tempId = `temp-${Date.now()}`;
    const newRow: Campaign = {
      id: tempId,
      projectId: activeProjectId,
      tableId: activeTableId,
      title: '',
      category: null,
      createdAt: Date.now(),
    };
    
    set((state) => ({ campaigns: [newRow, ...state.campaigns] }));
    
    try {
      const { id, ...rowWithoutId } = newRow;
      await addDoc(collection(db, 'campaigns'), rowWithoutId);
    } catch (error: any) {
      set((state) => ({ 
        campaigns: state.campaigns.filter(c => c.id !== tempId),
        error: error.message 
      }));
    }
  },

  updateCampaignField: async (id: string, field: string, value: any) => {
    const previousCampaigns = get().campaigns;
    
    set((state) => ({
      campaigns: state.campaigns.map((camp) => 
        camp.id === id ? { ...camp, [field]: value } : camp
      )
    }));

    try {
      const docRef = doc(db, 'campaigns', id);
      await updateDoc(docRef, { [field]: value });
    } catch (error: any) {
      console.error("Error updating document:", error);
      set({ campaigns: previousCampaigns, error: `Rollback: No se pudo guardar el cambio en ${field}` });
      setTimeout(() => set({ error: null }), 3000);
    }
  },

  updateColumnLabel: async (field: string, label: string) => {
    const { activeTableId, columnLabels } = get();
    const previousLabels = columnLabels;
    
    set({ columnLabels: { ...columnLabels, [field]: label } });
    
    try {
      await updateDoc(doc(db, 'tables', activeTableId), {
        columnLabels: { [field]: label }
      });
    } catch (error: any) {
      console.error(error);
      set({ columnLabels: previousLabels, error: `Error saving column name` });
      setTimeout(() => set({ error: null }), 3000);
    }
  },

  deleteCampaigns: async (ids: string[]) => {
    const previousCampaigns = get().campaigns;
    
    set((state) => ({
      campaigns: state.campaigns.filter((camp) => !ids.includes(camp.id))
    }));

    try {
      await Promise.all(ids.map((id) => deleteDoc(doc(db, 'campaigns', id))));
    } catch (error: any) {
      console.error("Error deleting documents:", error);
      set({ campaigns: previousCampaigns, error: `Rollback: No se pudo eliminar los registros` });
      setTimeout(() => set({ error: null }), 3000);
    }
  },

  addColumn: async (name: string) => {
    const { activeTableId, columns, columnLabels } = get();
    const newColId = `col_${Date.now()}`;
    const newColumns = [...columns, newColId];
    
    set({ 
      columns: newColumns, 
      columnLabels: { ...columnLabels, [newColId]: name } 
    });
 
    try {
      await updateDoc(doc(db, 'tables', activeTableId), {
        columns: newColumns,
        columnLabels: { [newColId]: name }
      });
    } catch (error: any) {
      set({ error: `Error al añadir columna` });
      setTimeout(() => set({ error: null }), 3000);
    }
  },
 
  deleteColumn: async (id: string) => {
    const { activeTableId, columns } = get();
    const newColumns = columns.filter(c => c !== id);
    
    set({ columns: newColumns });
 
    try {
      await updateDoc(doc(db, 'tables', activeTableId), {
        columns: newColumns
      });
    } catch (error: any) {
      set({ error: `Error al eliminar columna` });
      setTimeout(() => set({ error: null }), 3000);
    }
  },

  toggleTableFavorite: async (tableId: string) => {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) return;
      const email = user.email.toLowerCase();
      
      const table = get().tables.find(t => t.id === tableId);
      if (!table) return;

      const favs = table.favoriteBy || [];
      const newFavs = favs.includes(email)
        ? favs.filter(e => e !== email)
        : [...favs, email];

      await updateDoc(doc(db, 'tables', tableId), {
        favoriteBy: newFavs
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateProjectName: async (id: string, newName: string) => {
    const previousProjects = get().projects;
    
    set((state) => ({
      projects: state.projects.map((proj) => 
        proj.id === id ? { ...proj, name: newName } : proj
      )
    }));

    try {
      const docRef = doc(db, 'workspaces', id);
      await updateDoc(docRef, { name: newName });
    } catch (error: any) {
      console.error("Error updating project name:", error);
      set({ projects: previousProjects, error: `Error al renombrar espacio` });
      setTimeout(() => set({ error: null }), 3000);
    }
  },

  deleteProject: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'workspaces', id));
      
      const { activeProjectId, projects } = get();
      if (activeProjectId === id) {
        const remainingProjects = projects.filter(p => p.id !== id);
        if (remainingProjects.length > 0) {
          set({ activeProjectId: remainingProjects[0].id });
        }
      }
    } catch (error: any) {
      console.error("Error deleting project:", error);
      set({ error: `Error al eliminar espacio` });
      setTimeout(() => set({ error: null }), 3000);
    }
  },

  addMemberToProject: async (projectId: string, email: string) => {
    try {
      const proj = get().projects.find(p => p.id === projectId);
      if (!proj) return;
      const currentEmails = proj.memberEmails || [];
      if (!currentEmails.includes(email.toLowerCase())) {
        await updateDoc(doc(db, 'workspaces', projectId), {
          memberEmails: [...currentEmails, email.toLowerCase()]
        });
      }
    } catch (error: any) {
      console.error(error);
      set({ error: 'Error al añadir colaborador' });
      setTimeout(() => set({ error: null }), 3000);
    }
  },

  removeMemberFromProject: async (projectId: string, email: string) => {
    try {
      const proj = get().projects.find(p => p.id === projectId);
      if (!proj) return;
      const currentEmails = proj.memberEmails || [];
      await updateDoc(doc(db, 'workspaces', projectId), {
        memberEmails: currentEmails.filter(e => e !== email.toLowerCase())
      });
    } catch (error: any) {
      console.error(error);
    }
  },

  toggleFavoriteProject: async (projectId: string, email: string) => {
    try {
      const proj = get().projects.find(p => p.id === projectId);
      if (!proj) return;
      const favs = proj.favoriteBy || [];
      const emailLower = email.toLowerCase();
      const isFav = favs.includes(emailLower);
      
      await updateDoc(doc(db, 'workspaces', projectId), {
        favoriteBy: isFav ? favs.filter(e => e !== emailLower) : [...favs, emailLower]
      });
    } catch (error: any) {
      console.error("Error toggling favorite:", error);
    }
  },
  
  importRows: async (projectId: string, tableId: string, rows: any[]) => {
    try {
      const chunks = [];
      const chunkSize = 50;
      for (let i = 0; i < rows.length; i += chunkSize) {
        chunks.push(rows.slice(i, i + chunkSize));
      }

      for (const chunk of chunks) {
        await Promise.all(chunk.map(row => 
          addDoc(collection(db, 'campaigns'), {
            ...row,
            projectId,
            tableId,
            createdAt: Date.now()
          })
        ));
      }
    } catch (error: any) {
      console.error("Error importing rows:", error);
      set({ error: `Error al importar datos: ${error.message}` });
    }
  }
}));
