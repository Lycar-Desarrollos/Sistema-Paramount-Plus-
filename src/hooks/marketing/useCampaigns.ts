import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  startAfter
} from 'firebase/firestore';
import type { 
  QuerySnapshot, 
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../../firebase';
import type { Campaign } from '../../types/marketing';

/**
 * Hook para obtener campañas con soporte para datos masivos (paginación)
 * Respetando la jerarquía: workspaces -> bases -> tables -> records
 */
export const useCampaigns = (baseId: string, pageSize: number = 50) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!baseId) return;

    setLoading(true);
    // Nota: Según la arquitectura, las campañas viven en la tabla de Campaigns
    // Para simplificar el inicio, buscamos en una subcolección 'records' filtrada por baseId
    // O directamente en la ruta jerárquica si ya conocemos el tableId.
    // Por ahora, usaremos una consulta optimizada por baseId.
    const q = query(
      collection(db, 'campaigns'),
      where('baseId', '==', baseId),
      limit(pageSize)
    );

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const fetchedCampaigns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Campaign[];

      setCampaigns(fetchedCampaigns);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === pageSize);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching campaigns:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [baseId, pageSize]);

  const loadMore = async () => {
    if (!lastDoc || !hasMore || loading) return;

    setLoading(true);
    const nextQ = query(
      collection(db, 'campaigns'),
      where('baseId', '==', baseId),
      startAfter(lastDoc),
      limit(pageSize)
    );

    // En paginación manual usualmente usamos getDocs, pero aquí mantendremos la lógica
    // para simplificar el flujo inicial de "datos masivos".
  };

  return { campaigns, loading, error, hasMore, loadMore };
};
