import { doc } from "@firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useCallback, useContext } from "react";
import { AuthContext } from "src/providers/AuthProvider";
import { imagesStore, ImgPurpose } from "src/store/imagesStore";
import { db } from "./firebase";

// Function to upload an image to Firebase Storage
const uploadImage = async (
  uid: string,
  file: File,
  purpose: string
): Promise<string | null> => {
  window.alert(`Can't upload images yearsToDays. Pay a coffee ;)`);
  return Promise.resolve(null);
  const storageRef = ref(getStorage(), `images/${uid}/${file.name}`);
  // const storageRef = ref(getStorage(), `images/${file.name}`);

  return uploadBytes(storageRef, file, {
    customMetadata: {
      purpose,
    },
  })
    .then((snapshot) => getDownloadURL(snapshot.ref))
    .catch((error) => {
      console.error("Error uploading image: ", error);
      return null;
    });
};

// Function to retrieve image URL from Firebase Storage
const getImageURL = async (purpose: string): Promise<string> => {
  const imageRef = ref(getStorage(), purpose);

  return getDownloadURL(imageRef).catch((error) => {
    console.error("Error getting image URL: ", error);
    throw error;
  });
};

export const useImagine = () => {
  const uid = useContext(AuthContext)?.user?.uid;
  const { images, setImage } = imagesStore();

  const uploadImg = useCallback(
    async (file: File, whatIsYourQuest: ImgPurpose) => {
      if (uid) {
        const url = await uploadImage(uid, file, whatIsYourQuest);
        if (url) {
          setImage({ purpose: whatIsYourQuest, url });
        }
        return url;
      }
    },
    [uid]
  );

  const fetchImg = useCallback(
    async (whatIsYourQuest: ImgPurpose) => {
      return;
      if (uid) {
        const url = await getImageURL(whatIsYourQuest);
        if (url) {
          setImage({ purpose: whatIsYourQuest, url });
        }
        return url;
      }
    },
    [uid]
  );

  return { uploadImg, fetchImg, images };
};
