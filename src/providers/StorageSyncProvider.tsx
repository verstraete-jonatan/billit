// sync-context.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  memo,
} from "react";
import { setDoc, getDoc, doc } from "firebase/firestore";
import { db } from "../utils/firebase";
import { AuthContext } from "./AuthProvider";

import {
  useBillStore as billStore,
  useUserStore as userStore,
  useContactsStore as contactStore,
  useQrStore as qrCodeStore,
} from "../store/index";
import { deepEqual } from "src/utils";

export const storeRegistry = {
  bills: billStore,
  userDetails: userStore,
  qrCodes: qrCodeStore,
  contacts: contactStore,
};

type SyncStatus = "idle" | "loading";

interface SyncContextValue {
  status: SyncStatus;
  syncPercent?: number;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export const useSyncStorage = () => {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used inside <SyncProvider>");
  return ctx;
};

let confirmedOverwriteLocal: string = "";

export const SyncStorageProvider = memo(
  ({ children }: { children: React.ReactNode }) => {
    const [status, setStatus] = useState<SyncStatus>("idle");
    const [dirtyEntries, setDirtyEntries] = useState<Set<string>>(new Set());
    const uid = useContext(AuthContext).user?.uid;

    // Subscribe to all stores for changes
    useEffect(() => {
      const unsubscribes = Object.entries(storeRegistry).map(([name, store]) =>
        store.subscribe(() => {
          setDirtyEntries((prev) => new Set(prev).add(name));
        })
      );
      return () => unsubscribes.forEach((u) => u());
    }, []);

    // Function to push dirty entries to Firebase
    const syncNow = useCallback(async () => {
      if (!uid || dirtyEntries.size === 0) return;
      setStatus("loading");

      for (const name in storeRegistry) {
        if (!dirtyEntries.has(name)) continue;
        try {
          const store = storeRegistry[name as keyof typeof storeRegistry];
          const ref = doc(db, name, uid);
          const state = cleanState(store.getState());
          await setDoc(ref, state, { merge: true });
          setDirtyEntries((prev) => {
            const next = new Set(prev);
            next.delete(name);
            return next;
          });
        } catch (err) {
          console.error(`Failed syncing ${name}`, err);
        }
      }

      setStatus("idle");
    }, [uid, dirtyEntries]);

    // Auto sync every N seconds
    useEffect(() => {
      const interval = setInterval(syncNow, 5000);
      return () => clearInterval(interval);
    }, [syncNow]);

    // TODO: I am triggered twice initially
    useEffect(() => {
      if (!uid || confirmedOverwriteLocal === uid) {
        return;
      }
      confirmedOverwriteLocal = "";
      setStatus("loading");
      const hydrate = async () => {
        for (const name in storeRegistry) {
          const ref = doc(db, name, uid);
          const snap = await getDoc(ref);
          const remoteData = snap.data();

          const store = storeRegistry[name as keyof typeof storeRegistry];
          const localData = cleanState(store.getState());

          if (!deepEqual(remoteData, localData)) {
            // Naive conflict detection: if different, mark conflict
            // "Use local / Use remote?"
            // here you could show a UI dialog:
            // then apply user choice via store.setState(remoteData) or keep local
            if (
              confirmedOverwriteLocal ||
              window.confirm(
                "Some locale changes are not synced with the database. Want use local changes?"
              )
            ) {
              confirmedOverwriteLocal = uid;
              await setDoc(ref, localData, { merge: true });
            } else {
              (store.setState as any)(remoteData as any);
            }
          }
        }
        setStatus("idle");
      };
      hydrate();
    }, [uid]);

    return (
      <SyncContext.Provider value={{ status, syncNow }}>
        {children}
      </SyncContext.Provider>
    );
  }
);

const cleanState = (state: Record<any, any>) =>
  Object.fromEntries(
    Object.entries(state).filter(([k, i]) => typeof i !== "function")
  );
