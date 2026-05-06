import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../../firebase';
import type { ContentItem, ContentStatus } from '../../types/marketing';

export const useContentCalendar = (baseId: string) => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!baseId) return;

    const q = query(
      collection(db, 'content_calendar'),
      where('baseId', '==', baseId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ContentItem[];
      setItems(fetchedItems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [baseId]);

  const updateStatus = async (itemId: string, newStatus: ContentStatus) => {
    try {
      const docRef = doc(db, 'content_calendar', itemId);
      await updateDoc(docRef, { 
        status: newStatus,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Error updating content status:", error);
    }
  };

  return { items, loading, updateStatus };
};
