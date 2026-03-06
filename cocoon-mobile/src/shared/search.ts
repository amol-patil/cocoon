import Fuse, { type IFuseOptions, type FuseResultMatch } from 'fuse.js';
import { CocoonDocument } from './types';

export interface SearchResult {
  item: CocoonDocument;
  matches?: readonly FuseResultMatch[];
}

// Fuse.js config — mirrors desktop fuseOptions exactly
export const fuseOptions: IFuseOptions<CocoonDocument> = {
  includeScore: true,
  threshold: 0.35,
  keys: [
    { name: 'type', weight: 2 },
    { name: 'owner', weight: 1.5 },
    { name: 'category', weight: 1.5 },
    'fields.number',
    'fields.expires',
    'fields.issued',
    'fields.state',
    'fields.country',
    'fields.provider',
    'fields.policyNumber',
    'fields.groupNumber',
    // Search all field values generically
    { name: 'fields', getFn: (doc: CocoonDocument) => Object.values(doc.fields).filter(Boolean).join(' ') },
  ],
};

// Parse @owner and #category filter prefixes from query
export interface ParsedQuery {
  ownerFilter: string | null;
  categoryFilter: string | null;
  textQuery: string;
}

export function parseQuery(raw: string): ParsedQuery {
  let query = raw.trim();
  let ownerFilter: string | null = null;
  let categoryFilter: string | null = null;

  const ownerMatch = query.match(/@(\S+)/);
  if (ownerMatch) {
    ownerFilter = ownerMatch[1].toLowerCase();
    query = query.replace(ownerMatch[0], '').trim();
  }

  const catMatch = query.match(/#(\S+)/);
  if (catMatch) {
    categoryFilter = catMatch[1].toLowerCase();
    query = query.replace(catMatch[0], '').trim();
  }

  return { ownerFilter, categoryFilter, textQuery: query };
}

// Run the full search pipeline
export function searchDocuments(
  documents: CocoonDocument[],
  rawQuery: string,
  categoryTab?: string
): SearchResult[] {
  const { ownerFilter, categoryFilter, textQuery } = parseQuery(rawQuery);

  let filtered = documents;

  // Apply category tab filter
  if (categoryTab && categoryTab !== 'All') {
    filtered = filtered.filter(
      (d) => (d.category || d.type || '').toLowerCase() === categoryTab.toLowerCase()
    );
  }

  // Apply @owner filter
  if (ownerFilter) {
    filtered = filtered.filter((d) =>
      d.owner?.toLowerCase().includes(ownerFilter!)
    );
  }

  // Apply #category filter
  if (categoryFilter) {
    filtered = filtered.filter((d) =>
      (d.category || d.type || '').toLowerCase().includes(categoryFilter!)
    );
  }

  // Apply text search via Fuse.js
  if (textQuery) {
    const fuse = new Fuse(filtered, { ...fuseOptions, includeMatches: true });
    return fuse.search(textQuery).map((r) => ({
      item: r.item,
      matches: r.matches,
    }));
  }

  return filtered.map((item) => ({ item }));
}
