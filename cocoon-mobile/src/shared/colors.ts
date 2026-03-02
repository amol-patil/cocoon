// Shared color utilities — mirrored from desktop App.tsx
import { TagItem } from './types';

const CAT_COLOR_PALETTE = [
  '#4A90D9', // blue
  '#D4A847', // amber
  '#6E9E6E', // green
  '#D94A4A', // red
  '#9B6ED9', // purple
  '#4AABAA', // teal
];

const hashString = (s: string): number =>
  s.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

export const getCategoryColorHex = (category: string): string => {
  if (!category) return '#6E6E70';
  return CAT_COLOR_PALETTE[hashString(category) % CAT_COLOR_PALETTE.length];
};

/** Look up a tag's stored color, falling back to the hash-based palette. */
export const resolveTagColor = (name: string, tags: TagItem[]): string =>
  tags.find((t) => t.name === name)?.color ?? getCategoryColorHex(name);

export const getDocTypeColor = (doc: { category?: string; type?: string }): string =>
  getCategoryColorHex(doc.category || doc.type || '');

// Owner color — returns a hex color (mobile doesn't use Tailwind classes)
const OWNER_COLORS = [
  '#059669', // emerald
  '#2563EB', // blue
  '#7C3AED', // purple
  '#E11D48', // rose
  '#D97706', // amber
  '#0891B2', // cyan
];

export const getOwnerColor = (owner: string): string => {
  const hash = owner.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return OWNER_COLORS[hash % OWNER_COLORS.length];
};
