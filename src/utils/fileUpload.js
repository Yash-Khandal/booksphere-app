import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";

export const uploadPDF = async (file, onProgress) => {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    const storage = getStorage();
    const fileExtension = file.name.split('.').pop();
    
    // Create a unique filename with timestamp
    const timestamp = new Date().getTime();
    const uniqueFilename = `${auth.currentUser.uid}_${timestamp}.${fileExtension}`;
    
    // Create storage reference
    const storageRef = ref(storage, `pdfs/${uniqueFilename}`);
    
    // Create upload task
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    // Return promise that resolves with download URL
    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Progress function
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          // Error function
          reject(error);
        },
        async () => {
          // Complete function
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              url: downloadURL,
              filename: uniqueFilename,
              path: `pdfs/${uniqueFilename}`,
              size: file.size,
              type: file.type
            });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    throw error;
  }
};
