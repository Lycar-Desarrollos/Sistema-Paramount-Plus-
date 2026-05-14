/**
 * Firebase Storage Upload Service — NaticBox
 * Used for authenticated uploads within the app (GridEngine).
 * No additional configuration needed — uses existing Firebase setup.
 */

import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export interface StorageUploadResult {
  url: string;
  name: string;
  type: string;
  size: number;
  path: string;
}

/**
 * Upload a file to Firebase Storage.
 * Works for any authenticated user.
 */
export async function uploadToStorage(
  file: File,
  folder = 'attachments'
): Promise<StorageUploadResult> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  // Path must match storage.rules: attachments/{recordId}/{fileName}
  const path = `${folder}/${timestamp}_${safeName}`;
  const storageRef = ref(storage, path);

  const snapshot = await new Promise<any>((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on('state_changed', null, reject, () => resolve(task.snapshot));
  });

  const url = await getDownloadURL(snapshot.ref);

  return {
    url,
    name: file.name,
    type: file.type,
    size: file.size,
    path,
  };
}
