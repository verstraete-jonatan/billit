// AuthProvider.tsx
import React, { createContext, useEffect, useState, ReactNode } from "react";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import { app } from "../utils/firebase"; // assumes you have firebase initialized in firebase.ts
import { Login } from "src/pages/Auth/Login";
import { addToast } from "@heroui/react";

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType
);

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider).catch((err) => {
        addToast({
          color: "danger",
          title: "Uups! Login failed. Contact admin.",
          description:
            "if you'd like a better user experience than this bold error please donate or reach out.",
        });
      });
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    if (!window.confirm("Sure to logout?")) {
      return;
    }
    setLoading(true);
    try {
      await signOut(auth);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const authValue: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    logOut,
  };

  return (
    <AuthContext.Provider value={authValue}>
      <Login>{children}</Login>
    </AuthContext.Provider>
  );
};

export { AuthProvider };
