import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { ProcessedDocument } from '../services/documentProcessor';

interface CocoonDB extends DBSchema {
  documents: {
    key: string;
    value: ProcessedDocument;
    indexes: {
      'by-created': Date;
      'by-folder': string;
    };
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

let db: IDBPDatabase<CocoonDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<CocoonDB>> {
  if (!db) {
    db = await openDB<CocoonDB>('cocoon', 1, {
      upgrade(db) {
        // Create the documents store
        if (!db.objectStoreNames.contains('documents')) {
          const documentStore = db.createObjectStore('documents', {
            keyPath: 'id',
          });
          documentStore.createIndex('by-created', 'createdAt');
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
  return db;
}

export default getDB; 