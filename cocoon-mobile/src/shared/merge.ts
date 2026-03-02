import { CocoonDocument } from './types';

// Merge imported documents with existing ones — dedup by id, imported wins on conflict
export function mergeDocuments(
  existing: CocoonDocument[],
  imported: CocoonDocument[]
): { merged: CocoonDocument[]; added: number; updated: number } {
  const existingMap = new Map(existing.map((d) => [d.id, d]));
  let added = 0;
  let updated = 0;

  for (const doc of imported) {
    if (existingMap.has(doc.id)) {
      updated++;
    } else {
      added++;
    }
    existingMap.set(doc.id, doc);
  }

  return {
    merged: Array.from(existingMap.values()),
    added,
    updated,
  };
}
