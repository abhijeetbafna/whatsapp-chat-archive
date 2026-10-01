/**
 * IndexedDB Database Connection and Migration Manager
 * Versioned schema for WhatsApp Chat Archive local persistence.
 */

export const DB_NAME = 'whatsapp-chat-archive';
export const DB_VERSION = 1;

export const STORES = {
  ARCHIVES: 'archives',
  MESSAGES: 'messages',
  ATTACHMENTS: 'attachments',
} as const;

let dbInstance: IDBDatabase | null = null;

/**
 * Opens or retrieves a cached IndexedDB connection.
 */
export async function getDb(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  if (typeof window === 'undefined' || !window.indexedDB) {
    throw new Error('IndexedDB is not supported or unavailable in this environment.');
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      // Version 1: Initial schema
      if (oldVersion < 1) {
        // Archives store
        if (!db.objectStoreNames.contains(STORES.ARCHIVES)) {
          const archiveStore = db.createObjectStore(STORES.ARCHIVES, { keyPath: 'id' });
          archiveStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          archiveStore.createIndex('fingerprint', 'fingerprint', { unique: false });
          archiveStore.createIndex('title', 'title', { unique: false });
        }

        // Messages store
        if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
          const messageStore = db.createObjectStore(STORES.MESSAGES, { keyPath: 'id' });
          messageStore.createIndex('chatId', 'chatId', { unique: false });
          messageStore.createIndex('timestamp', 'timestamp', { unique: false });
          messageStore.createIndex('chatId_timestamp', ['chatId', 'timestamp'], { unique: false });
        }

        // Attachments store (stores binary blobs and metadata)
        if (!db.objectStoreNames.contains(STORES.ATTACHMENTS)) {
          const attachmentStore = db.createObjectStore(STORES.ATTACHMENTS, { keyPath: 'id' });
          attachmentStore.createIndex('archiveId', 'archiveId', { unique: false });
          attachmentStore.createIndex('fileName', 'fileName', { unique: false });
        }
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;

      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
      };

      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(new Error(`Failed to open IndexedDB database: ${request.error?.message || 'Unknown error'}`));
    };

    request.onblocked = () => {
      console.warn('Database upgrade blocked. Please close other tabs of this application.');
    };
  });
}

/**
 * Closes the current database connection (useful for tests and cleanup).
 */
export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Completely drops the database (for testing or full reset).
 */
export async function deleteAppDatabase(): Promise<void> {
  closeDb();
  if (typeof window === 'undefined' || !window.indexedDB) return;

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      console.warn('Database deletion blocked. Closing tabs might be needed.');
      resolve();
    };
  });
}
