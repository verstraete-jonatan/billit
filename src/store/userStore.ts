import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UserStore {
  user: User;
  setUser: (user: User) => void;
}

const emptyUser: User = {
  logo: "",
  voorwaardedenUrl: "",
  structuredMessage: "",
  settings: {
    invert: undefined,
    blackWhite: undefined,
  },
  id: "",
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
      setUser: (updated) => set({ user: { ...emptyUser, ...updated } }),
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
