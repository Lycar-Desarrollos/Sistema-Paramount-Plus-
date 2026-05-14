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

  // 1. Listen for Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserData(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // 2. Listen for Firestore User Document
  useEffect(() => {
    if (!user) return;

    let unsubscribeSnapshot: (() => void) | undefined;
    let isMounted = true;

    const fetchUserAndSubscribe = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        
        if (!isMounted) return;

        if (docSnap.exists()) {
          unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
              setUserData(doc.data() as UserData);
            }
          }, (error) => console.error("Firestore Auth Snapshot error:", error));
          setLoading(false);
        } else {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', user.email));
          const querySnapshot = await getDocs(q);
          
          if (!isMounted) return;

          if (!querySnapshot.empty) {
            const legacyDocRef = querySnapshot.docs[0].ref;
            unsubscribeSnapshot = onSnapshot(legacyDocRef, (doc) => {
              if (doc.exists()) {
                setUserData(doc.data() as UserData);
              }
            }, (error) => console.error("Firestore Legacy Auth Snapshot error:", error));
            setLoading(false);
          } else {
            const defaultUserData: UserData = {
              role: 'colaborador',
              email: user.email || '',
            };
            await setDoc(userDocRef, defaultUserData);
            
            if (!isMounted) return;

            unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
              if (doc.exists()) {
                setUserData(doc.data() as UserData);
              }
            }, (error) => console.error("Firestore Default Auth Snapshot error:", error));
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (isMounted) {
          setUserData({ role: 'colaborador', email: user.email || '' });
          setLoading(false);
        }
      }
    };

    fetchUserAndSubscribe();

    return () => {
      isMounted = false;
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
