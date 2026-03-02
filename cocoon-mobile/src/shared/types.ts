// Shared types — mirrored from desktop app/src/renderer/App.tsx

export interface DocumentField {
  [key: string]: string | undefined;
}

export interface TagItem {
  name: string;
  color: string;
}

export interface CocoonDocument {
  id: string;
  type: string;
  owner?: string;
  category?: string;
  defaultField: string;
  fields: DocumentField;
  fileLink: string;
  isTemporary: boolean;
}

// Mobile-only settings (desktop-only fields like globalShortcut are omitted)
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  owners: TagItem[];
  categories: TagItem[];
  biometricEnabled: boolean;
  clipboardAutoClearSeconds: number; // 0 = disabled
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  owners: [],
  categories: [],
  biometricEnabled: true,
  clipboardAutoClearSeconds: 30,
};

// Encrypted export format — must match desktop wire format exactly
export interface CocoonBackup {
  version: 1;
  salt: string;   // 32 random bytes, base64-encoded
  iv: string;     // 12 bytes, base64-encoded
  tag: string;    // 16 bytes GCM auth tag, base64-encoded
  ciphertext: string; // encrypted JSON, base64-encoded
}
