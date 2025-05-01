import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
// import { dummy_settings } from "./_dummy";

interface QrStore {
  settings: QrCodeSettings;
  updateSettings: (settings: QrCodeSettings) => void;
}

export const useQrStore = create<QrStore>()(
  persist(
    (set) => ({
      settings: {},
      updateSettings: (settings: QrCodeSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...settings } as QrCodeSettings,
        }));
      },
    }),
    {
      name: "qr-code-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
