import { openDB, IDBPDatabase, deleteDB } from 'idb';
import { Document, Folder, Tag } from '../types';

interface CocoonDB {
  documents: {
    key: string;
    value: Document;
    indexes: { 'by-folder': string; 'by-tag': string[] };
  };
  folders: {
    key: string;
    value: Folder;
    indexes: { 'by-parent': string };
  };
  tags: {
    key: string;
    value: Tag;
  };
}

let db: IDBPDatabase<CocoonDB> | null = null;

const DB_NAME = 'cocoon';
const DB_VERSION = 1;

export async function deleteDatabase() {
  try {
    await deleteDB(DB_NAME);
    console.log('Database deleted successfully');
  } catch (error) {
    console.error('Error deleting database:', error);
    throw error;
  }
}

export async function getDB(): Promise<IDBPDatabase<CocoonDB>> {
  if (db) {
    return db;
  }

  console.log('IndexedDB: Starting database initialization');
  db = await openDB<CocoonDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('documents')) {
        const documentsStore = db.createObjectStore('documents', { keyPath: 'id' });
        documentsStore.createIndex('by-folder', 'folderId');
        documentsStore.createIndex('by-tag', 'tags', { multiEntry: true });
      }
      if (!db.objectStoreNames.contains('folders')) {
        const foldersStore = db.createObjectStore('folders', { keyPath: 'id' });
        foldersStore.createIndex('by-parent', 'parentId');
      }
      if (!db.objectStoreNames.contains('tags')) {
        db.createObjectStore('tags', { keyPath: 'id' });
      }
    }
  });

  console.log('IndexedDB: Database opened successfully');
  console.log('IndexedDB: Current stores:', Array.from(db.objectStoreNames));

  // Log the number of documents
  const count = await db.count('documents');
  console.log('IndexedDB: Documents store count:', count);

  return db;
}

export default getDB; 