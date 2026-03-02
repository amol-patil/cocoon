import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CocoonDocument } from '../shared/types';
import * as repo from '../services/documentRepository';

interface DocumentsContextValue {
  documents: CocoonDocument[];
  isLoading: boolean;
  error: string | null;
  add: (doc: Omit<CocoonDocument, 'id'>) => Promise<CocoonDocument>;
  update: (doc: CocoonDocument) => Promise<void>;
  remove: (id: string) => Promise<void>;
  replaceAll: (docs: CocoonDocument[]) => Promise<void>;
  reload: () => Promise<void>;
}

const DocumentsContext = createContext<DocumentsContextValue | null>(null);

export function DocumentsProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<CocoonDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const docs = await repo.getAllDocuments();
      setDocuments(docs);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const add = useCallback(async (doc: Omit<CocoonDocument, 'id'>) => {
    const newDoc = await repo.addDocument(doc);
    setDocuments((prev) => [newDoc, ...prev]);
    return newDoc;
  }, []);

  const update = useCallback(async (doc: CocoonDocument) => {
    await repo.updateDocument(doc);
    setDocuments((prev) => prev.map((d) => (d.id === doc.id ? doc : d)));
  }, []);

  const remove = useCallback(async (id: string) => {
    await repo.deleteDocument(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const replaceAll = useCallback(async (docs: CocoonDocument[]) => {
    await repo.replaceAllDocuments(docs);
    repo.invalidateCache();
    setDocuments(docs);
  }, []);

  return (
    <DocumentsContext.Provider value={{ documents, isLoading, error, add, update, remove, replaceAll, reload }}>
      {children}
    </DocumentsContext.Provider>
  );
}

export function useDocuments(): DocumentsContextValue {
  const ctx = useContext(DocumentsContext);
  if (!ctx) throw new Error('useDocuments must be used inside DocumentsProvider');
  return ctx;
}
