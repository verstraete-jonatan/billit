// indexedDBStorage.ts
import { get, set, del } from "idb-keyval";
import { PersistStorage, StorageValue } from "zustand/middleware";

// Generic IndexedDB storage adapter for Zustand
export const createIndexedDBStorage = <T>(): PersistStorage<T> => ({
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
for (const [key, value] of Object.entries(localStorage)) {
  if (value) {
    set(key, value)
      .then(() => {
        console.log(`Migrated ${key} from localStorage to IndexedDB`);
        localStorage.removeItem(key);
      })
      .catch((e) => console.error(`Migration error for ${key}:`, e));
  }
}

export default createIndexedDBStorage;
