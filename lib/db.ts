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
