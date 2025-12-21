import { app, safeStorage } from "electron";
import * as path from "path";
import * as fs from "fs/promises";
import { Low } from "lowdb";

// --- Define Document structure ---
interface DataStore {
  documents: Document[];
}

interface DocumentField {
  [key: string]: string | undefined;
}
interface Document {
  id: string;
  type: string;
  owner?: string;
  defaultField: string;
  fields: DocumentField;
  fileLink: string;
  isTemporary: boolean;
}

// --- Configuration ---
const IS_DEV = !app.isPackaged;
const ENC_FILENAME = "cocoon_data.enc";
const LEGACY_FILENAME = IS_DEV ? "cocoon_data-dev.json" : "cocoon_data.json";

// --- Paths Setup ---
const userDataPath = app.getPath("userData");
const encDbPath = path.join(userDataPath, ENC_FILENAME);
const legacyDbPath = path.join(userDataPath, LEGACY_FILENAME);

console.log(`[SecureStore] Encrypted DB Path: ${encDbPath}`);
console.log(`[SecureStore] Legacy DB Path: ${legacyDbPath}`);

// --- Custom Adapter for Lowdb with Encryption ---
class EncryptedAdapter {
  async read(): Promise<DataStore | null> {
    // 1. Try reading encrypted file
    try {
      const encryptedBuffer = await fs.readFile(encDbPath);
      if (safeStorage.isEncryptionAvailable()) {
        const decryptedString = safeStorage.decryptString(encryptedBuffer);
        return JSON.parse(decryptedString);
      } else {
        throw new Error("Generic encryption is not available on this machine.");
      }
    } catch (error: any) {
      if (error.code === "ENOENT") {
        // Encrypted file doesn't exist. Check for migration.
        return await this.tryMigrateLegacy();
      } else {
        console.error("[SecureStore] Error reading encrypted file:", error);
        throw error;
      }
    }
  }

  async write(data: DataStore): Promise<void> {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("Encryption is not available.");
    }
    const jsonStr = JSON.stringify(data);
    const encryptedBuffer = safeStorage.encryptString(jsonStr);
    await fs.writeFile(encDbPath, encryptedBuffer);
  }

  private async tryMigrateLegacy(): Promise<DataStore | null> {
    console.log("[SecureStore] Checking for legacy file to migrate...");
    try {
      // Check if legacy file exists
      await fs.access(legacyDbPath);

      // Read legacy JSON
      const jsonStr = await fs.readFile(legacyDbPath, "utf-8");
      const data = JSON.parse(jsonStr) as DataStore;

      console.log("[SecureStore] Found legacy data. Migrating to encrypted storage...");

      // Write to new encrypted file
      await this.write(data);

      // Rename legacy file to .old
      const backupPath = `${legacyDbPath}.old`;
      await fs.rename(legacyDbPath, backupPath);
      console.log(`[SecureStore] Migration complete. Legacy file moved to ${backupPath}`);

      return data;
    } catch (error: any) {
      if (error.code === "ENOENT") {
        console.log("[SecureStore] No legacy file found. Starting fresh.");
        return null; // Return null to let Lowdb use default data
      }
      console.error("[SecureStore] Error during migration:", error);
      return null;
    }
  }
}

// --- Database Setup ---
const defaultData: DataStore = { documents: [] };
const adapter = new EncryptedAdapter();
let db: Low<DataStore> | null = null;
let dbInitializationPromise: Promise<void> | null = null;

async function ensureDbInitialized(): Promise<Low<DataStore>> {
  if (db) return db;

  if (!dbInitializationPromise) {
    dbInitializationPromise = (async () => {
      try {
        console.log("[SecureStore] Initializing database...");
        db = new Low(adapter, defaultData);
        await db.read();
        console.log(`[SecureStore] DB loaded with ${db.data.documents.length} docs.`);
      } catch (err) {
        console.error("[SecureStore] Initialization failed:", err);
        dbInitializationPromise = null;
        throw err;
      }
    })();
  }
  await dbInitializationPromise;
  if (!db) throw new Error("Database initialization failed critically.");
  return db;
}

// --- Exported Functions ---

export async function loadDocuments(): Promise<Document[]> {
  try {
    const currentDb = await ensureDbInitialized();
    return currentDb.data.documents || [];
  } catch (error) {
    console.error("[SecureStore] Error loading documents:", error);
    return [];
  }
}

export async function saveDocuments(documents: Document[]): Promise<void> {
  try {
    const currentDb = await ensureDbInitialized();
    currentDb.data = { documents };
    await currentDb.write();
    console.log(`[SecureStore] Saved ${documents.length} encrypted documents.`);
  } catch (error) {
    console.error("[SecureStore] Error saving documents:", error);
    throw new Error("Failed to save documents.");
  }
}

