import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createSyncStorage } from "./_storageSync";

interface UserStore {
  user: User;
  setUser: (user: Partial<User> | User) => void;
}

export const emptyUser: User = {
  email: "",
  voorwaardedenUrl: "",
  structuredMessage: "",
  darkMode: true,
  name: "",
  address: {
    street: "",
    houseNumber: "",
    city: "",
    country: "",
  },
  btw: "",
  iban: "",
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: { ...emptyUser },
      setUser: (updated) =>
        set(({ user }) => ({ user: { ...user, ...updated } })),
    }),
    {
      name: "user-storage",
      // storage: createJSONStorage(() => localStorage),
      storage: createSyncStorage<UserStore>(),
    }
  )
);
