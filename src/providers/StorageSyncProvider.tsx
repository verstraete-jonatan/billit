// sync-context.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
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
import { ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { useBeforeLeave } from "src/helpers";

export const storeRegistry = {
  bills: billStore,
  userDetails: userStore,
  qrCodes: qrCodeStore,
  contacts: contactStore,
};

type SyncStatus = "idle" | "loading" | "dirty";

interface SyncContextValue {
  status: SyncStatus;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export const useSyncStorage = () => {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used inside <SyncProvider>");
  return ctx;
};

let confirmedOverwriteLocal: string = "";

export const SyncStorageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [dirtyEntries, setDirtyEntries] = useState<Set<string>>(new Set());
  const { uid } = useContext(AuthContext).user ?? {};

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
    if (!uid || dirtyEntries.size === 0 || status === "loading") return;
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
  }, [uid, status, dirtyEntries]);

  // Auto sync every N seconds
  useEffect(() => {
    const interval = setInterval(syncNow, 5000);
    return () => clearInterval(interval);
  }, [syncNow]);

  // sync initial local changes
  useEffect(() => {
    if (!uid || confirmedOverwriteLocal === uid) {
      return;
    }
    confirmedOverwriteLocal = uid;

    setStatus("loading");
    const hydrate = async () => {
      const syncedItems: string[] = [];
      for (const name in storeRegistry) {
        const ref = doc(db, name, uid);
        const snap = await getDoc(ref);
        const remoteData = snap.data();

        const store = storeRegistry[name as keyof typeof storeRegistry];
        const localData = cleanState(store.getState());

        if (remoteData && !deepEqual(remoteData, localData)) {
          await setDoc(ref, localData, { merge: true });
          syncedItems.push(name);
          // (store.setState as any)(remoteData as any); // server data rules!

          // if (
          //   true ||
          //   confirmedOverwriteLocal ||
          //   window.confirm(
          //     "Some locale changes are not synced with the database. Use local changes, press 'OK', want to use database changes, press 'cancel'"
          //   )
          // ) {
          //   confirmedOverwriteLocal = uid;
          //   await setDoc(ref, localData, { merge: true });
          // } else {
          //   (store.setState as any)(remoteData as any);
          // }
        } else if (!remoteData && Object.keys(localData)) {
          await setDoc(ref, localData, { merge: true });
        }
        // todo: add nice alert to indicate that things are synced
      }
      setStatus("idle");
    };
    hydrate();
  }, [uid]);

  useBeforeLeave(dirtyEntries.size > 0, syncNow);

  return (
    <SyncContext.Provider value={{ status, syncNow }}>
      {children}
    </SyncContext.Provider>
  );
};

const cleanState = (state: Record<any, any>) => {
  const cleaned = { ...state };
  for (const k in cleaned) {
    // make sure we are not uploading images (legacy stuff)
    if (typeof cleaned[k] === "string" && cleaned[k].length) {
      try {
        const possibleBase64 = cleaned[k];
        btoa(atob(possibleBase64));
        delete cleaned[k];
      } catch (error) {
        continue;
      }
    }
  }

  return Object.fromEntries(
    Object.entries(cleaned).filter(([k, i]) => typeof i !== "function")
  );
};

const ConfirmSyncLocalChangesModal = ({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  return (
    <>
      <ModalHeader>Sync local changes</ModalHeader>
      <ModalBody>
        <h3>
          Some local changes are not present in the database (or mismatch)
        </h3>
        <p>
          this could be because you haven't synced them yet with the database
        </p>

        <hr />
        <p>Pressing "sync": will clear .. WIP</p>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onPress={onCancel}>
          Don't sync
        </Button>
        <Button variant="solid" color="primary" onPress={onConfirm}>
          Sync
        </Button>
      </ModalFooter>
    </>
  );
};
