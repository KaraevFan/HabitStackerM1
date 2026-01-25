/**
 * Photo storage using IndexedDB
 * Stores rep photos locally for habit evidence tracking
 */

const DB_NAME = 'habit-stacker-photos';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

interface StoredPhoto {
  id: string;
  dataUrl: string;
  timestamp: string;
}

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Save a photo to IndexedDB
 */
export async function savePhoto(id: string, dataUrl: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const photo: StoredPhoto = {
      id,
      dataUrl,
      timestamp: new Date().toISOString(),
    };

    const request = store.put(photo);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Load a photo from IndexedDB
 */
export async function loadPhoto(id: string): Promise<string | null> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result as StoredPhoto | undefined;
        resolve(result?.dataUrl || null);
      };

      transaction.oncomplete = () => db.close();
    });
  } catch {
    console.error('Failed to load photo:', id);
    return null;
  }
}

/**
 * Delete a photo from IndexedDB
 */
export async function deletePhoto(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Capture photo from camera
 * Returns data URL of captured image
 */
export async function capturePhoto(): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create hidden input for file capture
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use rear camera on mobile

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    };

    input.oncancel = () => reject(new Error('Capture cancelled'));

    input.click();
  });
}

/**
 * Pick photo from library
 * Returns data URL of selected image
 */
export async function pickPhoto(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // No capture attribute = opens library

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    };

    input.oncancel = () => reject(new Error('Selection cancelled'));

    input.click();
  });
}

/**
 * Compress image to reduce storage size
 * Targets ~500KB max
 */
export function compressImage(dataUrl: string, maxWidth = 800): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Scale down if larger than maxWidth
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      // Export as JPEG with 80% quality
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };

    img.onerror = () => {
      // If compression fails, return original
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}
