import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSyncStorage } from "./_storageSync";

export type ImgPurpose = "logo" | "future-proofing-bullshit";
type Img = { purpose: ImgPurpose; url: string };

interface ImagesStore {
  images: Record<string, string>;
  setImage: (img: Img) => void;
}

export const imagesStore = create<ImagesStore>()(
  persist(
    (set) => ({
      images: {},
      setImage: ({ purpose, url }) =>
        set(({ images }) => ({ images: { ...images, [purpose]: url } })),
    }),
    {
      name: "images-storage",
      storage: createSyncStorage<ImagesStore>(),
    }
  )
);
