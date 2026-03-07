import { CocoonDocument } from '../shared/types';
import { readEncrypted, writeEncrypted } from './secureStorage';
import * as Crypto from 'expo-crypto';

interface DataStore {
  documents: CocoonDocument[];
}

// --- In-memory cache ---
let cache: DataStore | null = null;

async function load(): Promise<DataStore> {
  if (cache) return cache;
  const raw = await readEncrypted();
  if (!raw) {
    cache = { documents: [] };
    return cache;
  }
  try {
    cache = JSON.parse(raw) as DataStore;
    // Ensure array exists
    if (!cache.documents) cache.documents = [];
  } catch {
    cache = { documents: [] };
  }
  return cache;
}

async function persist(): Promise<void> {
  if (!cache) return;
  await writeEncrypted(JSON.stringify(cache));
}

// --- Public CRUD API ---

export async function getAllDocuments(): Promise<CocoonDocument[]> {
  const store = await load();
  return [...store.documents];
}

export async function getDocument(id: string): Promise<CocoonDocument | null> {
  const store = await load();
  return store.documents.find((d) => d.id === id) ?? null;
}

export async function addDocument(
  doc: Omit<CocoonDocument, 'id'>
): Promise<CocoonDocument> {
  const store = await load();
  const newDoc: CocoonDocument = {
    ...doc,
    id: Crypto.randomUUID(),
  };
  store.documents.unshift(newDoc); // newest first
  await persist();
  return newDoc;
}

export async function updateDocument(doc: CocoonDocument): Promise<void> {
  const store = await load();
  const idx = store.documents.findIndex((d) => d.id === doc.id);
  if (idx === -1) throw new Error(`Document ${doc.id} not found`);
  store.documents[idx] = doc;
  await persist();
}

export async function deleteDocument(id: string): Promise<void> {
  const store = await load();
  store.documents = store.documents.filter((d) => d.id !== id);
  await persist();
}

export async function replaceAllDocuments(documents: CocoonDocument[]): Promise<void> {
  cache = { documents };
  await persist();
}

// Clear in-memory cache (call after import to force reload)
export function invalidateCache(): void {
  cache = null;
}
