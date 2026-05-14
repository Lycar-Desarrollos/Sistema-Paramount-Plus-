import { create } from 'zustand';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  getDocs, 
  query, 
  where,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  status: 'active' | 'archived';
  favoriteBy?: string[];
  memberEmails?: string[];
  members?: Record<string, UserRole | 'owner'>;
  clientPermissions?: Record<string, string[]>; // email -> array of table IDs
}

export type ColumnType = 'text' | 'number' | 'select' | 'date' | 'checkbox' | 'link' | 'user' | 'attachment';

export interface ColumnDefinition {
  id: string;
  name: string;
  type: ColumnType;
  config?: {
    options?: { label: string; color: string }[];
    targetTableId?: string; // Para Linked Records
  };
}

export type TableType = 'general' | 'requests';

export interface Table {
  id: string;
  projectId: string;
  name: string;
  type?: TableType;
  columnDefinitions: ColumnDefinition[];
  createdAt: number;
  favoriteBy?: string[];
}

export interface RecordData {
  id: string;
  tableId: string;
  values: Record<string, any>;
  createdBy?: string; // Track who created the request
  createdAt: number;
  updatedAt?: number;
}

export const DEFAULT_CATEGORIES = ['Priority (L)', 'Moderate (M)', 'Tentpole (XL)', 'Social Media', 'Branding'];

export const MARKETING_REQUEST_COLUMNS: ColumnDefinition[] = [
  { id: 'title', name: 'Title', type: 'text' },
  { id: 'status', name: 'Status', type: 'select', config: { 
    options: [
      { label: 'Nueva', color: '#6366f1' },
      { label: 'In process', color: '#f59e0b' },
      { label: 'En Revisión', color: '#8b5cf6' },
      { label: 'Aprobado', color: '#10b981' },
      { label: 'Publicado', color: '#ec4899' }
    ]
  }},
  { id: 'type', name: 'Type Asset', type: 'select', config: {
    options: [
      { label: 'Video', color: '#ef4444' },
      { label: 'Static', color: '#3b82f6' },
      { label: 'Motion Graphics', color: '#8b5cf6' }
    ]
  }},
  { id: 'cantidad', name: 'Cantidad', type: 'number' },
  { id: 'channel_s', name: 'Channel (s)', type: 'text' },
  { id: 'channel_d', name: 'Channel (D)', type: 'text' },
  { id: 'delivery_a', name: 'Delivery (A)', type: 'text' },
  { id: 'delivery_d', name: 'Delivery (D)', type: 'text' },
  { id: 'dimensions', name: 'Dimension', type: 'text' },
  { id: 'duration', name: 'Duration/s', type: 'text' },
  { id: 'file_format', name: 'File Format', type: 'text' },
  { id: 'inc_price', name: 'Include Price?', type: 'checkbox' },
  { id: 'inc_title', name: 'Include Title?', type: 'text' },
  { id: 'mkt_own', name: 'MKT OWN', type: 'text' },
  { id: 'month', name: 'Month', type: 'text' },
  { id: 'notes', name: 'Notes', type: 'text' }
];

export const DEFAULT_COLUMNS_V2: ColumnDefinition[] = [
  { id: 'title', name: 'Nombre', type: 'text' },
  { id: 'category', name: 'Categoría', type: 'select', config: { 
    options: DEFAULT_CATEGORIES.map(c => ({ label: c, color: '#6366f1' })) 
  }},
  { id: 'date', name: 'Fecha', type: 'date' }
];

export const DEFAULT_FORM_COLUMNS: ColumnDefinition[] = [
  { id: 'title', name: 'Título de la solicitud', type: 'text' },
  { id: 'type', name: 'Tipo de Pieza', type: 'select', config: {
    options: [
      { label: 'Video', color: '#ef4444' },
      { label: 'Static', color: '#3b82f6' },
      { label: 'Motion Graphics', color: '#8b5cf6' }
    ]
  }},
  { id: 'cantidad', name: 'Cantidad de Piezas', type: 'number' },
  { id: 'channels', name: 'Canales o Plataformas', type: 'text' },
  { id: 'dimensions', name: 'Dimensiones', type: 'text' },
  { id: 'duration', name: 'Duración (segundos)', type: 'text' },
  { id: 'file_format', name: 'Formato de Archivo', type: 'text' },
  { id: 'delivery_date', name: 'Fecha de Entrega Esperada', type: 'date' },
  { id: 'notes', name: 'Notas / Descripción', type: 'text' },
  { id: 'assets', name: 'Archivos de Referencia', type: 'attachment' },
];

export type UserRole = 'admin' | 'colaborador' | 'cliente';

interface CampaignStore {
  activeProjectId: string;
  activeTableId: string;
  setActiveProjectId: (id: string) => void;
  setActiveTableId: (id: string) => void;
  projects: Project[];
  tables: Table[];
  records: RecordData[];
  allUsers: { email: string; displayName?: string; photoURL?: string }[];
  columnDefinitions: ColumnDefinition[];
  loading: boolean;
  error: string | null;
  initializeGlobal: (user: any, userData: any) => () => void;
  initializeProjectData: (projectId: string) => () => void;
  initializeTableData: (tableId: string) => () => void;
  addProject: (name: string, template: string) => Promise<void>;
  addTable: (projectId: string, name: string, type: TableType, columns: ColumnDefinition[], rows?: any[]) => Promise<void>;
  addRecord: (tableId: string, values: Record<string, any>) => Promise<void>;
  updateRecord: (id: string, values: Record<string, any>) => Promise<void>;
  updateRecordField: (id: string, field: string, value: any) => Promise<void>;
  deleteRecords: (ids: string[]) => Promise<void>;
  addColumn: (tableId: string, name: string, type: ColumnType, config?: any) => Promise<void>;
  deleteColumn: (tableId: string, columnId: string) => Promise<void>;
  updateColumnConfig: (tableId: string, columnId: string, config: any) => Promise<void>;
  updateColumn: (tableId: string, columnId: string, updates: Partial<ColumnDefinition>) => Promise<void>;
  fetchRecordsByTableId: (tableId: string) => Promise<RecordData[]>;
  updateProjectName: (id: string, newName: string) => Promise<void>;
  updateTable: (id: string, newName: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addMemberToProject: (projectId: string, email: string, role: UserRole) => Promise<void>;
  removeMemberFromProject: (projectId: string, email: string) => Promise<void>;
  setClientPermissions: (projectId: string, email: string, tableIds: string[]) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  importRows: (projectId: string, tableId: string, rows: any[]) => Promise<void>;
  toggleTableFavorite: (tableId: string) => Promise<void>;
  toggleFavoriteProject: (projectId: string, email: string) => Promise<void>;
  isProMode: boolean;
  setIsProMode: (val: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (val: boolean) => void;
  isAiSimulating: boolean;
  setIsAiSimulating: (val: boolean) => void;
  aiLoadingText: string;
  setAiLoadingText: (val: string) => void;
  triggerAiSimulation: (textSequence?: string[], duration?: number) => Promise<void>;
}

export const useCampaignStore = create<CampaignStore>((set, get) => ({
  activeProjectId: '',
  activeTableId: '',
  setActiveProjectId: (id) => set({ activeProjectId: id }),
  setActiveTableId: (id) => set({ activeTableId: id }),
  projects: [],
  tables: [],
  records: [],
  allUsers: [],
  columnDefinitions: [],
  loading: false,
  error: null,
  isProMode: false,
  setIsProMode: (val: boolean) => set({ isProMode: val }),
  isSidebarCollapsed: localStorage.getItem('natic_sidebar_collapsed') === 'true',
  setIsSidebarCollapsed: (val: boolean) => {
    localStorage.setItem('natic_sidebar_collapsed', String(val));
    set({ isSidebarCollapsed: val });
  },
  isAiSimulating: false,
  setIsAiSimulating: (val: boolean) => set({ isAiSimulating: val }),
  aiLoadingText: '',
  setAiLoadingText: (val: string) => set({ aiLoadingText: val }),
  triggerAiSimulation: async (textSequence = ['Analizando espacio...', 'Optimizando flujos...', 'Listo.'], duration = 3000) => {
    set({ isAiSimulating: true, aiLoadingText: textSequence[0] });
    const step = duration / textSequence.length;
    
    for (let i = 1; i < textSequence.length; i++) {
      await new Promise(r => setTimeout(r, step));
      set({ aiLoadingText: textSequence[i] });
    }
    
    await new Promise(r => setTimeout(r, 500));
    set({ isAiSimulating: false });
  },

  initializeGlobal: (user: any, userData: any) => {
    if (!user || !user.email) {
      set({ loading: false });
      return () => {};
    }

    set({ loading: true });

    // Filtramos los workspaces para que solo traiga donde el usuario es miembro
    const q = query(
      collection(db, 'workspaces'), 
      where('memberEmails', 'array-contains', user.email.toLowerCase())
    );

    const unsubWorkspaces = onSnapshot(q, (snapshot) => {
      const workspacesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      const sorted = workspacesData.sort((a, b) => a.createdAt - b.createdAt);
      set({ projects: sorted, loading: false });

      if (sorted.length > 0 && !get().activeProjectId) {
        set({ activeProjectId: sorted[0].id });
      }
    }, (error) => {
      console.error("Error loading workspaces:", error);
      set({ loading: false });
    });

    let unsubUsers = () => {};
    const MASTER_ADMIN_UID = "0buVJpHGDMehlHphXsGxWCpPibP2";
    if (userData?.role === 'admin' || user.uid === MASTER_ADMIN_UID) {
      unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        set({ allUsers: usersData });
      }, (err) => {
        console.error("Error in users listener:", err);
      });
    }

    return () => {
      unsubWorkspaces();
      unsubUsers();
    };
  },

  initializeProjectData: (projectId: string) => {
    const tablesQuery = query(collection(db, 'tables'), where('projectId', '==', projectId));
    const unsubscribeTables = onSnapshot(tablesQuery, (snapshot) => {
      const tablesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Table[];
      const sorted = tablesData.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      
      set({ tables: sorted });

      // Solo cambiamos la tabla activa si no hay una o si la actual ya no existe en este proyecto
      const currentActiveId = get().activeTableId;
      if (sorted.length > 0) {
        if (!currentActiveId || !sorted.find(t => t.id === currentActiveId)) {
          set({ activeTableId: sorted[0].id });
        }
      }
      
      set({ loading: false });
    }, (error) => {
      console.error("Error loading tables:", error);
      set({ loading: false });
    });

    return unsubscribeTables;
  },

  initializeTableData: (tableId: string) => {
    // Traemos solo los registros de la tabla activa para evitar bloqueos de seguridad
    const q = query(collection(db, 'campaigns'), where('tableId', '==', tableId));
    
    const unsubRecords = onSnapshot(q, (snapshot) => {
      const fetchedRecords = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as RecordData[];
      
      const sorted = fetchedRecords.sort((a, b) => b.createdAt - a.createdAt);
      set({ records: sorted });
      
      const table = get().tables.find(t => t.id === tableId);
      if (table) {
        set({ columnDefinitions: table.columnDefinitions || [] });
      }
    }, (error) => {
      console.error("Error loading records:", error);
    });

    return unsubRecords;
  },

  addProject: async (name: string, template: string) => {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("Usuario no autenticado");
      const email = user.email.toLowerCase();

      set({ loading: true });
      const newProjectRef = await addDoc(collection(db, 'workspaces'), {
        name,
        createdAt: Date.now(),
        status: 'active',
        ownerId: user.uid,
        memberEmails: [email],
        members: { [email.replace(/\./g, '_')]: 'owner' }
      });

      const cols = template === 'marketing' ? MARKETING_REQUEST_COLUMNS : DEFAULT_COLUMNS_V2;
      const type = template === 'marketing' ? 'requests' : 'general';
      
      const tableRef = await addDoc(collection(db, 'tables'), {
        projectId: newProjectRef.id,
        name: template === 'marketing' ? 'Solicitudes de Marketing' : 'Datos Principales',
        type,
        columnDefinitions: cols,
        createdAt: Date.now()
      });

      // Añadir 10 filas por defecto
      const emptyValues = cols.reduce((acc, col) => {
        acc[col.id] = "";
        return acc;
      }, {} as Record<string, any>);

      const promises = Array.from({ length: 10 }).map((_, i) => {
        return addDoc(collection(db, 'campaigns'), {
          tableId: tableRef.id,
          values: emptyValues,
          createdBy: email,
          createdAt: Date.now() + i
        });
      });
      await Promise.all(promises);

      set({ activeProjectId: newProjectRef.id, loading: false });
    } catch (error: any) {
      console.error("Error creating project:", error);
      set({ error: error.message, loading: false });
    }
  },

  addTable: async (projectId: string, name: string, type: TableType, columns: ColumnDefinition[], rows?: any[]) => {
    if (!projectId) {
      console.error("Cannot add table: projectId is missing");
      set({ error: "ID de proyecto faltante" });
      return;
    }
    
    try {
      console.log("Adding table to project:", projectId, name);
      
      // Generamos el ID localmente para que sea instantáneo
      const tableRef = doc(collection(db, 'tables'));
      const tableId = tableRef.id;

      const newTable: Table = {
        id: tableId,
        projectId,
        name,
        type,
        columnDefinitions: columns,
        createdAt: Date.now()
      };

      // 1. Actualizamos la interfaz DE INMEDIATO
      set(state => ({
        tables: [...state.tables, newTable].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)),
        activeTableId: tableId,
        columnDefinitions: columns
      }));

      // 2. Guardamos en Firebase en segundo plano
      const { setDoc } = await import('firebase/firestore');
      await setDoc(tableRef, {
        projectId,
        name,
        type,
        columnDefinitions: columns,
        createdAt: Date.now()
      });

      // 3. Crear 10 filas por defecto
      const emptyValues = columns.reduce((acc, col) => {
        acc[col.id] = "";
        return acc;
      }, {} as Record<string, any>);

      const user = auth.currentUser;
      const email = user?.email || 'System';

      const promises = Array.from({ length: 10 }).map((_, i) => {
        return addDoc(collection(db, 'campaigns'), {
          tableId: tableId,
          values: emptyValues,
          createdBy: email.toLowerCase(),
          createdAt: Date.now() + i
        });
      });
      await Promise.all(promises);
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addRecord: async (tableId: string, values: Record<string, any>) => {
    const idToUse = tableId || get().activeTableId;
    
    if (!idToUse) {
      console.error("Cannot add record: tableId is missing");
      set({ error: "ID de tabla faltante" });
      return;
    }

    try {
      const user = auth.currentUser;
      const email = user?.email || 'System';
      
      // Limpiamos los valores para evitar 'undefined' que rompe Firebase
      const sanitizedValues: Record<string, any> = {};
      if (values) {
        Object.keys(values).forEach(key => {
          if (values[key] !== undefined) {
            sanitizedValues[key] = values[key];
          } else {
            sanitizedValues[key] = ""; // Fallback a vacío
          }
        });
      }

      console.log("Adding record to table:", idToUse, sanitizedValues);
      
      const docRef = await addDoc(collection(db, 'campaigns'), {
        tableId: idToUse,
        values: sanitizedValues,
        createdBy: email.toLowerCase(),
        createdAt: Date.now()
      });
      
      console.log("Record added successfully:", docRef.id);
    } catch (error: any) {
      console.error("Error adding record:", error);
      set({ error: error.message });
      throw error;
    }
  },

  updateRecord: async (id: string, values: Record<string, any>) => {
    try {
      const recordRef = doc(db, 'campaigns', id);
      await updateDoc(recordRef, {
        values,
        updatedAt: Date.now()
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateRecordField: async (id: string, field: string, value: any) => {
    try {
      set(state => ({
        records: state.records.map(r => r.id === id ? { ...r, values: { ...r.values, [field]: value } } : r)
      }));

      const recordRef = doc(db, 'campaigns', id);
      await updateDoc(recordRef, {
        [`values.${field}`]: value,
        updatedAt: Date.now()
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteRecords: async (ids: string[]) => {
    try {
      for (const id of ids) {
        await deleteDoc(doc(db, 'campaigns', id));
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addColumn: async (tableId: string, name: string, type: ColumnType, config?: any) => {
    try {
      const tableRef = doc(db, 'tables', tableId);
      const newColumn: ColumnDefinition = {
        id: `col_${Date.now()}`,
        name,
        type,
        config: config || {}
      };
      
      const updatedColumns = [...get().columnDefinitions, newColumn];
      
      // Actualización optimista inmediata
      set({ columnDefinitions: updatedColumns });
      
      await updateDoc(tableRef, {
        columnDefinitions: updatedColumns
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteColumn: async (tableId: string, columnId: string) => {
    try {
      const tableRef = doc(db, 'tables', tableId);
      const updatedColumns = get().columnDefinitions.filter(c => c.id !== columnId);
      
      set({ columnDefinitions: updatedColumns });

      await updateDoc(tableRef, {
        columnDefinitions: updatedColumns
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateColumnConfig: async (tableId: string, columnId: string, config: any) => {
    try {
      const tableRef = doc(db, 'tables', tableId);
      const updatedColumns = get().columnDefinitions.map(c => 
        c.id === columnId ? { ...c, config: { ...c.config, ...config } } : c
      );
      
      set({ columnDefinitions: updatedColumns });

      await updateDoc(tableRef, {
        columnDefinitions: updatedColumns
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateColumn: async (tableId: string, columnId: string, updates: Partial<ColumnDefinition>) => {
    try {
      const tableRef = doc(db, 'tables', tableId);
      const updatedColumns = get().columnDefinitions.map(c => 
        c.id === columnId ? { ...c, ...updates } : c
      );
      
      set({ columnDefinitions: updatedColumns });

      await updateDoc(tableRef, {
        columnDefinitions: updatedColumns
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchRecordsByTableId: async (tableId: string) => {
    try {
      const q = query(collection(db, 'campaigns'), where('tableId', '==', tableId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id })) as RecordData[];
    } catch (error: any) {
      console.error(error);
      return [];
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
    try {
      const docRef = doc(db, 'workspaces', id);
      
      set(state => ({
        projects: state.projects.map(p => p.id === id ? { ...p, name: newName } : p)
      }));

      await updateDoc(docRef, { name: newName });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateTable: async (id: string, newName: string) => {
    try {
      const docRef = doc(db, 'tables', id);
      
      set(state => ({
        tables: state.tables.map(t => t.id === id ? { ...t, name: newName } : t)
      }));

      await updateDoc(docRef, { name: newName });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteProject: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'workspaces', id));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addMemberToProject: async (projectId: string, email: string, role: UserRole = 'colaborador') => {
    try {
      const docRef = doc(db, 'workspaces', projectId);
      const docSnap = await (await import('firebase/firestore')).getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Workspace no encontrado en la base de datos.');
      }

      const projData = docSnap.data();
      const currentEmails = projData.memberEmails || [];
      const emailLower = email.toLowerCase();

      const updateData: any = {
        [`members.${emailLower.replace(/\./g, '_')}`]: role
      };

      if (!currentEmails.includes(emailLower)) {
        updateData.memberEmails = [...currentEmails, emailLower];
      }

      await updateDoc(docRef, updateData);
    } catch (error: any) {
      console.error("Error in addMemberToProject:", error);
      throw error; // Throw so the UI can catch and display the error
    }
  },
  removeMemberFromProject: async (projectId: string, email: string) => {
    try {
      const proj = get().projects.find(p => p.id === projectId);
      if (!proj) return;
      const currentEmails = proj.memberEmails || [];
      const emailLower = email.toLowerCase();
      
      const { deleteField } = await import('firebase/firestore');
      
      await updateDoc(doc(db, 'workspaces', projectId), {
        memberEmails: currentEmails.filter((e: string) => e !== emailLower),
        [`members.${emailLower.replace(/\./g, '_')}`]: deleteField(),
        [`clientPermissions.${emailLower.replace(/\./g, '_')}`]: deleteField()
      });
    } catch (error: any) {
      console.error(error);
    }
  },
  
  setClientPermissions: async (projectId: string, email: string, tableIds: string[]) => {
    try {
      const emailKey = email.toLowerCase().replace(/\./g, '_');
      await updateDoc(doc(db, 'workspaces', projectId), {
        [`clientPermissions.${emailKey}`]: tableIds
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteTable: async (tableId: string) => {
    try {
      await deleteDoc(doc(db, 'tables', tableId));
      const q = query(collection(db, 'campaigns'), where('tableId', '==', tableId));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
    } catch (error: any) {
      set({ error: error.message });
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
        favoriteBy: isFav ? favs.filter((e: string) => e !== emailLower) : [...favs, emailLower]
      });
    } catch (error: any) {
      console.error(error);
    }
  },
  
  importRows: async (projectId: string, tableId: string, rows: any[]) => {
    try {
      for (const row of rows) {
        await addDoc(collection(db, 'campaigns'), {
          tableId,
          values: row,
          createdAt: Date.now()
        });
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  }
}));
