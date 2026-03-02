/**
 * secureStorage.ts
 *
 * Security model:
 * - A random 32-byte AES master key is generated on first launch
 * - The key is stored in iOS Keychain via expo-secure-store (WHEN_UNLOCKED_THIS_DEVICE_ONLY)
 * - Document data is encrypted with AES-256-GCM and stored on disk
 * - Format: base64(nonce[12] + ciphertext + tag[16])
 */

import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import { gcm } from '@noble/ciphers/aes.js';

const KEY_STORE_KEY = 'cocoon_master_key_v1';
const DATA_FILE = FileSystem.documentDirectory + 'cocoon_data.enc';

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

// --- Key management ---

async function getMasterKey(): Promise<Uint8Array> {
  let keyB64 = await SecureStore.getItemAsync(KEY_STORE_KEY, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });

  if (!keyB64) {
    const keyBytes = Crypto.getRandomBytes(32);
    keyB64 = toBase64(keyBytes);
    await SecureStore.setItemAsync(KEY_STORE_KEY, keyB64, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }

  return fromBase64(keyB64);
}

// --- Encrypt / Decrypt ---

function encrypt(plaintext: string, key: Uint8Array): string {
  const nonce = Crypto.getRandomBytes(12);
  const cipher = gcm(key, nonce);
  const plaintextBytes = new TextEncoder().encode(plaintext);
  const ciphertext = cipher.encrypt(plaintextBytes); // includes 16-byte GCM tag appended
  const combined = new Uint8Array(12 + ciphertext.length);
  combined.set(nonce, 0);
  combined.set(ciphertext, 12);
  return toBase64(combined);
}

function decrypt(encB64: string, key: Uint8Array): string {
  const combined = fromBase64(encB64);
  const nonce = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const cipher = gcm(key, nonce);
  const plaintext = cipher.decrypt(ciphertext);
  return new TextDecoder().decode(plaintext);
}

// --- Public API ---

export async function readEncrypted(): Promise<string | null> {
  try {
    const key = await getMasterKey();
    const encB64 = await FileSystem.readAsStringAsync(DATA_FILE);
    return decrypt(encB64, key);
  } catch {
    return null; // File doesn't exist yet or decryption failed
  }
}

export async function writeEncrypted(plaintext: string): Promise<void> {
  const key = await getMasterKey();
  const encB64 = encrypt(plaintext, key);
  await FileSystem.writeAsStringAsync(DATA_FILE, encB64);
}

export async function deleteEncryptedData(): Promise<void> {
  try {
    await FileSystem.deleteAsync(DATA_FILE, { idempotent: true });
  } catch {}
}
