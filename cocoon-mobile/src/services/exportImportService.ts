/**
 * exportImportService.ts
 *
 * Encrypted export/import using AES-256-GCM + PBKDF2-SHA256.
 * Wire format matches desktop exactly:
 *   { version:1, salt:b64, iv:b64, tag:b64, ciphertext:b64 }
 *
 * PBKDF2: SHA-256, 600,000 iterations, 32-byte key
 */

import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import { gcm } from '@noble/ciphers/aes.js';
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { CocoonDocument, CocoonBackup } from '../shared/types';
import { mergeDocuments } from '../shared/merge';

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

// --- Key derivation (matches desktop) ---
function deriveKey(password: string, salt: Uint8Array): Uint8Array {
  return pbkdf2(sha256, password, salt, { c: 600_000, dkLen: 32 });
}

// --- Encrypt for export ---
function encryptBackup(plaintext: string, password: string): string {
  const salt = Crypto.getRandomBytes(32);
  const iv = Crypto.getRandomBytes(12);
  const key = deriveKey(password, salt);
  const cipher = gcm(key, iv);
  const ciphertextWithTag = cipher.encrypt(new TextEncoder().encode(plaintext));

  // GCM tag is the last 16 bytes of noble's output
  const ciphertext = ciphertextWithTag.slice(0, -16);
  const tag = ciphertextWithTag.slice(-16);

  const backup: CocoonBackup = {
    version: 1,
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

  const salt = fromBase64(backup.salt);
  const iv = fromBase64(backup.iv);
  const tag = fromBase64(backup.tag);
  const ciphertext = fromBase64(backup.ciphertext);

  const key = deriveKey(password, salt);

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
  password: string
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

export async function importDocuments(
  existingDocuments: CocoonDocument[],
  password: string
): Promise<ImportResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    throw new Error('Import cancelled');
  }

  const file = result.assets[0];
  const content = await FileSystem.readAsStringAsync(file.uri);

  // Support both encrypted (.cocoon) and legacy plaintext JSON
  let documents: CocoonDocument[];
  try {
    const parsed = JSON.parse(content);
    if (parsed.ciphertext) {
      // Encrypted format
      const decrypted = decryptBackup(content, password);
      documents = JSON.parse(decrypted).documents;
    } else if (parsed.documents) {
      // Legacy plaintext
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
