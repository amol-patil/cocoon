import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CocoonDB extends DBSchema {
  documents: {
    key: string;
    value: {
      id: string;
      name: string;
      type: string;
      content: string;
      ocrText: string;
      tags: string[];
      folderId?: string;
      createdAt: Date;
      updatedAt: Date;
    };
    indexes: { 'by-date': Date };
  };
  folders: {
    key: string;
    value: {
      id: string;
      name: string;
      parentId?: string;
      createdAt: Date;
      updatedAt: Date;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<CocoonDB>>;

export const initDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB<CocoonDB>('cocoon-db', 1, {
      upgrade(db) {
        // Create the documents store
        if (!db.objectStoreNames.contains('documents')) {
          const documentStore = db.createObjectStore('documents', {
            keyPath: 'id',
          });
          documentStore.createIndex('by-date', 'createdAt');
        }

        // Create the folders store
        if (!db.objectStoreNames.contains('folders')) {
          db.createObjectStore('folders', {
            keyPath: 'id',
          });
        }
      },
    });
  }
  return dbPromise;
};

export const getDB = () => {
  if (!dbPromise) {
    throw new Error('Database not initialized. Call initDB first.');
  }
  return dbPromise;
};

export default {
  initDB,
  getDB,
}; 