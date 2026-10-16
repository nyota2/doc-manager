// File contents live in IndexedDB; document records reference them by id.

const DB_NAME = "zbvault";
const STORE = "blobs";

let dbPromise: Promise<IDBDatabase> | null = null;

function db() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  return db().then(
    (d) =>
      new Promise<T>((resolve, reject) => {
        const req = run(d.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export async function putBlob(blob: Blob) {
  const id = crypto.randomUUID();
  await tx("readwrite", (s) => s.put(blob, id));
  return id;
}

export function getBlob(id: string) {
  return tx<Blob | undefined>("readonly", (s) => s.get(id));
}

export function deleteBlob(id: string) {
  return tx("readwrite", (s) => s.delete(id));
}
