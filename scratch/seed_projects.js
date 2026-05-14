
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
const envPath = join(__dirname, '../.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const firebaseConfig = {
  apiKey: envConfig.VITE_FIREBASE_API_KEY,
  authDomain: envConfig.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envConfig.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envConfig.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envConfig.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envConfig.VITE_FIREBASE_APP_ID,
  measurementId: envConfig.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const MARKETING_REQUEST_COLUMNS = [
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
  { id: 'assigned_to', name: 'Responsable', type: 'user' },
  { id: 'type', name: 'Type Asset', type: 'select', config: {
    options: [
      { label: 'Video', color: '#ef4444' },
      { label: 'Static', color: '#3b82f6' },
      { label: 'Motion Graphics', color: '#8b5cf6' }
    ]
  }},
  { id: 'notes', name: 'Notes', type: 'text' }
];

const collaborators = [
  { email: 'colab1@natic.com', name: 'Colaborador A', project: 'Proyecto Marketing A' },
  { email: 'colab2@natic.com', name: 'Colaborador B', project: 'Proyecto Marketing B' },
  { email: 'colab3@natic.com', name: 'Colaborador C', project: 'Proyecto Marketing C' }
];

const adminEmail = 'admin@natic.com';

async function seed() {
  console.log("Starting seed process...");

  for (const colab of collaborators) {
    console.log(`Creating ${colab.project}...`);
    
    // 1. Create Workspace
    const workspaceRef = await addDoc(collection(db, 'workspaces'), {
      name: colab.project,
      createdAt: Date.now(),
      status: 'active',
      memberEmails: [adminEmail, colab.email],
      members: {
        [adminEmail.replace(/\./g, '_')]: 'owner',
        [colab.email.replace(/\./g, '_')]: 'colaborador'
      }
    });
    
    console.log(`  Workspace created with ID: ${workspaceRef.id}`);

    // 2. Create Table
    const tableRef = await addDoc(collection(db, 'tables'), {
      projectId: workspaceRef.id,
      name: 'Solicitudes de Marketing',
      type: 'requests',
      columnDefinitions: MARKETING_REQUEST_COLUMNS,
      createdAt: Date.now()
    });
    
    console.log(`  Table created with ID: ${tableRef.id}`);

    // 3. Create Record assigned to colab
    const recordRef = await addDoc(collection(db, 'campaigns'), {
      tableId: tableRef.id,
      values: {
        title: `Tarea para ${colab.name}`,
        status: 'Nueva',
        assigned_to: colab.email,
        type: 'Video',
        notes: 'Esta es la línea asignada automáticamente.'
      },
      createdBy: adminEmail,
      createdAt: Date.now()
    });
    
    console.log(`  Record created with ID: ${recordRef.id}`);
  }

  console.log("Seed process finished successfully!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Error during seed:", err);
  process.exit(1);
});
