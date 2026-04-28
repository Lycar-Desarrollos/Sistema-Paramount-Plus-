import { create } from 'zustand';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, query, where, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface Project {
  id: string;
  name: string;
  createdAt: number;
}

export interface Campaign {
  id: string;
  projectId: string;
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
  setActiveProjectId: (id: string) => void;
  projects: Project[];
  campaigns: Campaign[];
  columns: string[];
  columnLabels: Record<string, string>;
  loading: boolean;
  error: string | null;
  initializeGlobal: () => () => void; 
  initializeProjectData: (projectId: string) => () => void; 
  addProject: (name: string, template?: { columns: string[], labels: Record<string, string> }) => Promise<void>;
  addCampaign: () => Promise<void>;
  updateCampaignField: (id: string, field: string, value: any) => Promise<void>;
  updateColumnLabel: (field: string, label: string) => Promise<void>;
  deleteCampaigns: (ids: string[]) => Promise<void>;
  addColumn: (name: string) => Promise<void>;
  deleteColumn: (id: string) => Promise<void>;
  updateProjectName: (id: string, newName: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

export const useCampaignStore = create<CampaignStore>((set, get) => ({
  activeProjectId: 'lat-br', 
  setActiveProjectId: (id: string) => {
    set({ activeProjectId: id, loading: true });
  },
  projects: [],
  campaigns: [],
  columns: DEFAULT_COLUMNS,
  columnLabels: DEFAULT_LABELS,
  loading: true,
  error: null,

  initializeGlobal: () => {
    const unsubProjects = onSnapshot(collection(db, 'workspaces'), (snapshot) => {
      const fetchedProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      
      const sorted = fetchedProjects.sort((a, b) => a.createdAt - b.createdAt);
      set({ projects: sorted });

      if (sorted.length === 0) {
        get().addProject('Campaign Tracker - LAT & BR');
      } else {
        if (!sorted.find(p => p.id === get().activeProjectId)) {
          set({ activeProjectId: sorted[0].id });
        }
      }
    });

    return unsubProjects;
  },

  initializeProjectData: (projectId: string) => {
    set({ loading: true });
    const unsubProject = onSnapshot(doc(db, 'projects', projectId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        set({ 
          columnLabels: { ...DEFAULT_LABELS, ...(data.columnLabels || {}) },
          columns: data.columns || DEFAULT_COLUMNS
        });
      } else {
        set({ columnLabels: DEFAULT_LABELS, columns: DEFAULT_COLUMNS });
      }
    });

    const q = query(collection(db, 'campaigns'), where('projectId', '==', projectId));
    const unsubCampaigns = onSnapshot(
      q,
      (snapshot) => {
        const fetchedData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Campaign[];
        fetchedData.sort((a,b) => b.createdAt - a.createdAt);
        set({ campaigns: fetchedData, loading: false, error: null });
      },
      (error) => {
        console.error('Firestore Error:', error);
        set({ error: error.message, loading: false });
      }
    );
    
    return () => {
      unsubProject();
      unsubCampaigns();
    };
  },

  addProject: async (name: string, template?: { columns: string[], labels: Record<string, string> }) => {
    try {
      const newRef = await addDoc(collection(db, 'workspaces'), {
        name,
        createdAt: Date.now()
      });
      
      if (template) {
        await setDoc(doc(db, 'projects', newRef.id), {
          columns: template.columns,
          columnLabels: template.labels
        });
      }
      
      set({ activeProjectId: newRef.id });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addCampaign: async () => {
    const { activeProjectId } = get();
    const tempId = `temp-${Date.now()}`;
    const newRow: Campaign = {
      id: tempId,
      projectId: activeProjectId,
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
    const { activeProjectId, columnLabels } = get();
    const previousLabels = columnLabels;
    
    set({ columnLabels: { ...columnLabels, [field]: label } });
    
    try {
      await setDoc(doc(db, 'projects', activeProjectId), {
        columnLabels: { [field]: label }
      }, { merge: true });
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
    const { activeProjectId, columns, columnLabels } = get();
    const newColId = `col_${Date.now()}`;
    const newColumns = [...columns, newColId];
    
    set({ 
      columns: newColumns, 
      columnLabels: { ...columnLabels, [newColId]: name } 
    });

    try {
      await setDoc(doc(db, 'projects', activeProjectId), {
        columns: newColumns,
        columnLabels: { [newColId]: name }
      }, { merge: true });
    } catch (error: any) {
      set({ error: `Error al añadir columna` });
      setTimeout(() => set({ error: null }), 3000);
    }
  },

  deleteColumn: async (id: string) => {
    const { activeProjectId, columns } = get();
    const newColumns = columns.filter(c => c !== id);
    
    set({ columns: newColumns });

    try {
      await setDoc(doc(db, 'projects', activeProjectId), {
        columns: newColumns
      }, { merge: true });
    } catch (error: any) {
      set({ error: `Error al eliminar columna` });
      setTimeout(() => set({ error: null }), 3000);
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
  }
}));
