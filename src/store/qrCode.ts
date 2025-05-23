import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
// import { dummy_settings } from "./_dummy";

interface QrStore {
  settings: QrCodeSettings;
  updateSettings: (settings: Partial<QrCodeSettings>) => void;
}

export const useQrStore = create<QrStore>()(
  persist(
    (set) => ({
      settings: { enableLogo: true },
      updateSettings: (settings) => {
        set((state) => ({
          settings: { ...state.settings, ...settings } satisfies QrCodeSettings,
        }));
      },
    }),
    {
      name: "qr-code-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useQrCodeSettings = () => useQrStore().settings;
