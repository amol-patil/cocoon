/**
 * shareService.ts
 *
 * Handles two share flows:
 * - Quick Share (Flow A): Captures styled card as image + shares via share sheet
 * - Secure Share (Flow B): Encrypts selected fields as .cocoon snippet + shares
 *
 * Reuses encryption from exportImportService.
 */

import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import { gcm } from '@noble/ciphers/aes.js';
import { pbkdf2Sync } from 'react-native-quick-crypto';
import { CocoonDocument, CocoonBackup } from '../shared/types';
import ViewShot from 'react-native-view-shot';

const PBKDF2_ITERATIONS = 600_000;
const COCOON_DOWNLOAD_URL = 'https://cocoonvault.app/download';
const SHARE_MESSAGE = `Shared securely from Cocoon — ${COCOON_DOWNLOAD_URL}`;

// --- Base64 helpers ---

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

// --- Key derivation ---

function deriveKey(password: string, salt: Uint8Array): Uint8Array {
  const result = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 32, 'sha256');
  return new Uint8Array(result);
}

// --- Encrypt snippet ---

function encryptSnippet(plaintext: string, pin: string): string {
  const salt = Crypto.getRandomBytes(32);
  const iv = Crypto.getRandomBytes(12);
  const key = deriveKey(pin, salt);
  const cipher = gcm(key, iv);
  const ciphertextWithTag = cipher.encrypt(new TextEncoder().encode(plaintext));

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

// --- Flow A: Quick Share (Image Card) ---

export async function shareAsImage(viewShotRef: React.RefObject<ViewShot | null>): Promise<void> {
  if (!viewShotRef.current?.capture) {
    throw new Error('ViewShot ref not ready');
  }

  const uri = await viewShotRef.current.capture();

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing not available on this device');

  // Copy to a file with .png extension for proper MIME type
  const sharePath = FileSystem.cacheDirectory + 'cocoon_share.png';
  await FileSystem.copyAsync({ from: uri, to: sharePath });

  await Sharing.shareAsync(sharePath, {
    mimeType: 'image/png',
    dialogTitle: 'Share Document',
    UTI: 'public.png',
  });
}

export function getShareMessage(): string {
  return SHARE_MESSAGE;
}

// --- Flow B: Secure Share (Encrypted .cocoon snippet) ---

export interface ShareSnippetData {
  /** The document this snippet was created from */
  sourceDocType: string;
  sourceDocCategory?: string;
  sourceDocOwner?: string;
  /** Selected fields only */
  fields: Record<string, string>;
}

export async function shareEncrypted(
  data: ShareSnippetData,
  pin: string,
): Promise<void> {
  // Build a minimal document array for compatibility with import flow
  const doc: CocoonDocument = {
    id: Crypto.randomUUID(),
    type: data.sourceDocType,
    owner: data.sourceDocOwner ?? '',
    category: data.sourceDocCategory ?? '',
    defaultField: Object.keys(data.fields)[0] ?? '',
    fields: data.fields,
    fileLink: '',
    isTemporary: false,
  };

  const plaintext = JSON.stringify({ documents: [doc] });
  const encrypted = encryptSnippet(plaintext, pin);

  const fileName = `shared-${data.sourceDocType.toLowerCase().replace(/\s+/g, '-')}.cocoon`;
  const tmpPath = FileSystem.cacheDirectory + fileName;
  await FileSystem.writeAsStringAsync(tmpPath, encrypted);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing not available on this device');

  await Sharing.shareAsync(tmpPath, {
    mimeType: 'application/octet-stream',
    dialogTitle: 'Share Encrypted Document',
    UTI: 'public.data',
  });
}
