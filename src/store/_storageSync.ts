import { doc, getDoc, setDoc } from "@firebase/firestore";
import { get, set, del } from "idb-keyval";
import { db } from "src/utils/firebase";
import { PersistStorage, StorageValue } from "zustand/middleware";

// Firebase + IndexedDB hybrid storage

const createFirebaseStorage = <T>(
  collection: string,
  docId: string
): PersistStorage<T> => {
  const local = createIndexedDBStorage<T>();
  const ref = doc(db, collection, docId);

  return {
    getItem: async (name) => {
      // First try local
      const localValue = await local.getItem(name);
      if (localValue) return localValue;

      // If not in local, fetch from Firebase
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as StorageValue<T>;
        // Cache locally
        await local.setItem(name, data);
        return data;
      }
      return null;
    },

    setItem: async (name, value) => {
      // Save locally first
      await local.setItem(name, value);
      // Push to Firebase in background
      await setDoc(ref, value, { merge: true });
    },

    removeItem: async (name) => {
      await local.removeItem(name);
      await setDoc(ref, {}, { merge: false }); // or deleteDoc
    },
  };
};

// Generic IndexedDB storage adapter for Zustand
const createIndexedDBStorage = <T>(): PersistStorage<T> => ({
  getItem: async (name: string): Promise<StorageValue<T> | null> => {
    try {
      const value = await get<string>(name);
      if (value == null) return null;
      return JSON.parse(value) as StorageValue<T>;
    } catch (error) {
      console.error(`IndexedDB getItem error for ${name}:`, error);
      return null;
    }
  },
  setItem: async (name: string, value: StorageValue<T>): Promise<void> => {
    try {
      await set(name, JSON.stringify(value));
    } catch (error) {
      console.error(`IndexedDB setItem error for ${name}:`, error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await del(name);
    } catch (error) {
      console.error(`IndexedDB removeItem error for ${name}:`, error);
    }
  },
});

// Migration utility to move data from localStorage to IndexedDB
// for (const [key, value] of Object.entries(localStorage)) {
//   if (value) {
//     set(key, value)
//       .then(() => {
//         console.log(`Migrated ${key} from localStorage to IndexedDB`);
//         localStorage.removeItem(key);
//       })
//       .catch((e) => console.error(`Migration error for ${key}:`, e));
//   }
// }

export const createSyncStorage = createIndexedDBStorage;
