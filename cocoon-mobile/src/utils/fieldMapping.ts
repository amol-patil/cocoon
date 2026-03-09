import { CocoonDocument } from '../shared/types';
import { ScanResult } from '../services/scanService';

const LABEL_MAP: Record<string, string> = {
  license_number: 'License Number',
  date_of_birth: 'Date of Birth',
  expiry_date: 'Expiry Date',
  issue_date: 'Issue Date',
  document_number: 'Document Number',
  card_number: 'Card Number',
  name: 'Full Name',
  address: 'Address',
  class: 'Class',
  sex: 'Sex',
  height: 'Height',
  nationality: 'Nationality',
  passport_number: 'Passport Number',
};

function toTitleCase(snake: string): string {
  return snake.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function normalizeFieldLabel(key: string): string {
  return LABEL_MAP[key] ?? toTitleCase(key);
}

export function scanResultToDocument(result: ScanResult): Partial<CocoonDocument> | null {
  if (!result.parsed?.type || !result.parsed?.fields) return null;

  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(result.parsed.fields)) {
    if (typeof value === 'string' && value.trim()) {
      fields[normalizeFieldLabel(key)] = value.trim();
    }
  }

  return {
    type: result.parsed.type,
    fields,
    defaultField: Object.keys(fields)[0] ?? '',
    fileLink: '',
    isTemporary: false,
  };
}
