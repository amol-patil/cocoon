import { useState, useMemo } from 'react';
import { CocoonDocument } from '../shared/types';
import { searchDocuments } from '../shared/search';

export function useSearch(documents: CocoonDocument[]) {
  const [query, setQuery] = useState('');
  const [categoryTab, setCategoryTab] = useState('All');

  const results = useMemo(() => {
    if (!query && categoryTab === 'All') return documents;
    return searchDocuments(documents, query, categoryTab);
  }, [documents, query, categoryTab]);

  // Derive unique owners and categories for filter chips
  const owners = useMemo(
    () => [...new Set(documents.map((d) => d.owner).filter(Boolean) as string[])].sort(),
    [documents]
  );

  const categories = useMemo(
    () => [...new Set(documents.map((d) => d.category || d.type).filter(Boolean) as string[])].sort(),
    [documents]
  );

  return { query, setQuery, categoryTab, setCategoryTab, results, owners, categories };
}
