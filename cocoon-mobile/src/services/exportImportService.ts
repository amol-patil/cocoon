/**
 * exportImportService.ts
 *
 * Encrypted export/import using AES-256-GCM + PBKDF2-SHA256.
 * Wire format:
 *   { version:1, iterations:N, salt:b64, iv:b64, tag:b64, ciphertext:b64 }
 *
 * PBKDF2: SHA-256, 600,000 iterations, 32-byte key (native OpenSSL via quick-crypto).
 * Matches desktop security exactly. Compatible in both directions.
 */

import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import { gcm } from '@noble/ciphers/aes.js';
import { pbkdf2Sync } from 'react-native-quick-crypto';
import { CocoonDocument, CocoonBackup } from '../shared/types';
import { mergeDocuments } from '../shared/merge';

// Same 600k iterations as desktop — native OpenSSL makes this fast (<1s)
const PBKDF2_ITERATIONS = 600_000;

// --- Base64 helpers (no Buffer — works in Hermes) ---

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// --- Key derivation (native OpenSSL via react-native-quick-crypto) ---

function deriveKey(password: string, salt: Uint8Array, iterations: number): Uint8Array {
  const result = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
  // pbkdf2Sync returns Buffer — convert to Uint8Array for noble/ciphers
  return new Uint8Array(result);
}

// --- Encrypt for export ---

function encryptBackup(plaintext: string, password: string): string {
  const salt = Crypto.getRandomBytes(32);
  const iv = Crypto.getRandomBytes(12);
  const key = deriveKey(password, salt, PBKDF2_ITERATIONS);
  const cipher = gcm(key, iv);
  const ciphertextWithTag = cipher.encrypt(new TextEncoder().encode(plaintext));

  // GCM tag is the last 16 bytes of noble's output
  const ciphertext = ciphertextWithTag.slice(0, -16);
  const tag = ciphertextWithTag.slice(-16);

  const backup: CocoonBackup = {
    version: 1,
    iterations: PBKDF2_ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    tag: toBase64(tag),
    ciphertext: toBase64(ciphertext),
  };

  return JSON.stringify(backup, null, 2);
}

// --- Decrypt imported backup ---

function decryptBackup(backupJson: string, password: string): string {
  const backup = JSON.parse(backupJson) as CocoonBackup;
  if (backup.version !== 1) throw new Error('Unsupported backup version');

  const iterations = backup.iterations ?? PBKDF2_ITERATIONS;
  const salt = fromBase64(backup.salt);
  const iv = fromBase64(backup.iv);
  const tag = fromBase64(backup.tag);
  const ciphertext = fromBase64(backup.ciphertext);

  const key = deriveKey(password, salt, iterations);

  // noble/ciphers gcm expects ciphertext+tag concatenated
  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext, 0);
  combined.set(tag, ciphertext.length);

  const cipher = gcm(key, iv);
  const decrypted = cipher.decrypt(combined);
  return new TextDecoder().decode(decrypted);
}

// --- Public API ---

export async function exportDocuments(
  documents: CocoonDocument[],
  password: string,
): Promise<void> {
  const plaintext = JSON.stringify({ documents });
  const encrypted = encryptBackup(plaintext, password);

  const tmpPath = FileSystem.cacheDirectory + 'cocoon_backup.cocoon';
  await FileSystem.writeAsStringAsync(tmpPath, encrypted);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing not available on this device');

  await Sharing.shareAsync(tmpPath, {
    mimeType: 'application/octet-stream',
    dialogTitle: 'Save Cocoon Backup',
    UTI: 'public.data',
  });
}

export interface ImportResult {
  added: number;
  updated: number;
  merged: CocoonDocument[];
}

export interface PickedFile {
  uri: string;
  name: string;
  content: string;
  needsPassword: boolean;
}

/** Step 1: Pick a .cocoon file and determine if it needs a password. */
export async function pickImportFile(): Promise<PickedFile> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    throw new Error('Import cancelled');
  }

  const file = result.assets[0];
  const content = await FileSystem.readAsStringAsync(file.uri);

  const parsed = JSON.parse(content);
  const needsPassword = !!parsed.ciphertext;

  return { uri: file.uri, name: file.name ?? 'backup.cocoon', content, needsPassword };
}

/** Step 2: Decrypt (if needed) and merge into existing documents. */
export async function decryptAndImportFile(
  existingDocuments: CocoonDocument[],
  pickedFile: PickedFile,
  password: string,
): Promise<ImportResult> {
  let documents: CocoonDocument[];
  try {
    const parsed = JSON.parse(pickedFile.content);
    if (parsed.ciphertext) {
      const decrypted = decryptBackup(pickedFile.content, password);
      documents = JSON.parse(decrypted).documents;
    } else if (parsed.documents) {
      documents = parsed.documents;
    } else {
      throw new Error('Unrecognised backup format');
    }
  } catch (e: any) {
    if (e.message === 'Unrecognised backup format') throw e;
    throw new Error('Failed to decrypt — check your password and try again');
  }

  return mergeDocuments(existingDocuments, documents);
}
