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
import { addToast, Button } from "@heroui/react";

import { app } from "../utils/firebase";

import imgGoogle from "../assets/google.png";
import { Home } from "../pages/Home";

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
      {user ? (
        children
      ) : (
        <div className="w-screen h-screen">
          <Home title={loading ? "Loading.." : "Billit"}>
            <Button
              color="primary"
              onPress={signInWithGoogle}
              disabled={!signInWithGoogle}
              isLoading={loading}
              size="lg"
              className="w-fit"
            >
              Login with google
              <img src={imgGoogle} className="w-8 h-8" />
            </Button>
          </Home>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export { AuthProvider };
