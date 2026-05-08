import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

export type UserRole = 'admin' | 'colaborador' | 'cliente';

interface UserData {
  role: UserRole;
  email: string;
  photoURL?: string;
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Primero intentamos buscar por UID (la forma correcta a partir de ahora)
          const userDocRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            // Documento existe por UID, suscribirse a cambios en tiempo real
            const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
              if (doc.exists()) {
                setUserData(doc.data() as UserData);
              }
            });
            // Cleanup previous snapshot if auth state changes
            setLoading(false);
            return () => unsubscribeSnapshot();
          } else {
            // Si no existe por UID, buscamos por email (legacy)
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', currentUser.email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              const legacyDocRef = querySnapshot.docs[0].ref;
              const unsubscribeSnapshot = onSnapshot(legacyDocRef, (doc) => {
                if (doc.exists()) {
                  setUserData(doc.data() as UserData);
                }
              });
              setLoading(false);
              return () => unsubscribeSnapshot();
            } else {
              // Si el usuario no existe en la base de datos
              const defaultUserData: UserData = {
                role: 'colaborador',
                email: currentUser.email || '',
              };
              await setDoc(userDocRef, defaultUserData);
              
              const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                  setUserData(doc.data() as UserData);
                }
              });
              setLoading(false);
              return () => unsubscribeSnapshot();
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Default fallback on error
          setUserData({ role: 'colaborador', email: currentUser.email || '' });
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
