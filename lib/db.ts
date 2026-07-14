// lib/db.ts

const DB_NAME = "TabKeepDB";
const DB_VERSION = 1;
const STORE_NAME = "thumbnails";

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                // Gunakan URL sebagai key
                db.createObjectStore(STORE_NAME, { keyPath: "url" });
            }
        };
    });

    return dbPromise;
}

export async function saveThumbnail(url: string, blob: Blob): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        
        const request = store.put({ url, blob, timestamp: Date.now() });
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function getThumbnail(url: string): Promise<Blob | null> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        
        const request = store.get(url);
        
        request.onsuccess = () => {
            if (request.result) {
                resolve(request.result.blob);
            } else {
                resolve(null);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

export async function deleteThumbnail(url: string): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        
        const request = store.delete(url);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function getAllThumbnails(): Promise<Record<string, string>> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = async () => {
            const results = request.result || [];
            const thumbnails: Record<string, string> = {};
            
            const blobToBase64 = (blob: Blob): Promise<string> => {
                return new Promise((res, rej) => {
                    const reader = new FileReader();
                    reader.onloadend = () => res(reader.result as string);
                    reader.onerror = rej;
                    reader.readAsDataURL(blob);
                });
            };

            try {
                for (const item of results) {
                    if (item.url && item.blob) {
                        thumbnails[item.url] = await blobToBase64(item.blob);
                    }
                }
                resolve(thumbnails);
            } catch (e) {
                reject(e);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

export async function importThumbnails(thumbnails: Record<string, string>): Promise<void> {
    const db = await getDB();
    
    const base64ToBlob = async (base64: string): Promise<Blob> => {
        const res = await fetch(base64);
        return await res.blob();
    };

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        
        const keys = Object.keys(thumbnails);
        if (keys.length === 0) {
            resolve();
            return;
        }

        let completed = 0;
        let hasError = false;

        keys.forEach(async (url) => {
            try {
                const base64 = thumbnails[url];
                if (base64.startsWith("data:image")) {
                    const blob = await base64ToBlob(base64);
                    store.put({ url, blob, timestamp: Date.now() });
                }
            } catch (e) {
                console.error("Failed to restore thumbnail for", url, e);
                hasError = true;
            } finally {
                completed++;
                if (completed === keys.length) {
                    if (hasError) {
                        console.warn("Some thumbnails failed to import.");
                    }
                    resolve();
                }
            }
        });

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}
