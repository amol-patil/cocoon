'use client';

import { useState, useEffect } from 'react';
import { getDB } from '@/lib/storage/indexeddb';
import type { ProcessedDocument } from '@/lib/services/documentProcessor';

export function useDocuments() {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const db = await getDB();
        const docs = await db.getAll('documents');
        setDocuments(docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      } catch (err) {
        console.error('Failed to load documents:', err);
        setError(err instanceof Error ? err.message : 'Failed to load documents');
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, []);

  return { documents, loading, error };
} 