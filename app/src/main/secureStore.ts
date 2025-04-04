import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises'; // Use promises version
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node'; // Import adapter from lowdb/node
import * as crypto from 'crypto';
import * as keytar from 'keytar'; // Import keytar

// --- Keytar Configuration ---
const KEYTAR_SERVICE = 'CocoonApp'; // Should be unique to your app
const KEYTAR_ACCOUNT = 'cocoon-encryption-key'; // Describes the key's purpose

// Define the structure of our data file
interface DataStore {
  documents: Document[];
}

// Define the type for our document items (matching renderer)
interface DocumentField { [key: string]: string | undefined }
interface Document {
  id: string;
  type: string;
  defaultField: string;
  fields: DocumentField;
  fileLink: string;
}

// --- Configuration ---
const IS_DEV = !app.isPackaged; // Check if running in development
const DB_FILENAME = IS_DEV ? 'cocoon_data-dev.enc' : 'cocoon_data.enc';
console.log(`Running in ${IS_DEV ? 'DEVELOPMENT' : 'PRODUCTION'} mode.`);
console.log(`Using data file: ${DB_FILENAME}`);

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES-GCM
const TAG_LENGTH = 16; // For AES-GCM auth tag
const KEY_LENGTH = 32; // For AES-256 key

// --- DB Setup ---
const dbPath = path.join(app.getPath('userData'), DB_FILENAME);
console.log('Database path:', dbPath);

// We'll manage the Lowdb instance manually with encryption
let db: Low<DataStore> | null = null;
let encryptionKey: Buffer | null = null; // Store the key in memory after retrieving/generating

// --- Encryption Key Management ---

/**
 * Retrieves the encryption key from the OS keychain or generates a new one.
 * Stores the key in memory for the current session.
 */
async function ensureEncryptionKey(): Promise<Buffer> {
    if (encryptionKey) {
        return encryptionKey;
    }

    try {
        console.log(`Attempting to retrieve key from keychain: service=${KEYTAR_SERVICE}, account=${KEYTAR_ACCOUNT}`);
        const storedKeyHex = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT);

        if (storedKeyHex) {
            console.log('Encryption key found in keychain.');
            encryptionKey = Buffer.from(storedKeyHex, 'hex');
            if (encryptionKey.length !== KEY_LENGTH) {
                 console.error(`Keychain key length mismatch! Expected ${KEY_LENGTH}, got ${encryptionKey.length}. Regenerating key.`);
                 // Fall through to generate a new key if length is wrong
            } else {
                 return encryptionKey;
            }
        }

        // If key not found or length mismatch, generate a new one
        console.log('Encryption key not found or invalid in keychain. Generating new key...');
        const newKey = crypto.randomBytes(KEY_LENGTH);
        await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT, newKey.toString('hex'));
        console.log('New encryption key generated and stored in keychain.');
        encryptionKey = newKey;
        return encryptionKey;

    } catch (error) {
        console.error('Error accessing keychain:', error);
        // Fallback: Use a temporary, less secure key IN MEMORY ONLY if keychain fails.
        // This is NOT ideal but prevents crashing. Data won't persist across restarts
        // if keychain remains inaccessible.
        console.warn('Keychain access failed. Using temporary in-memory key for this session ONLY.');
        encryptionKey = crypto.randomBytes(KEY_LENGTH);
        return encryptionKey;
        // Alternatively, you could throw an error and prevent the app from saving/loading data.
        // throw new Error('Failed to get or generate encryption key due to keychain error.');
    }
}

// --- Encryption/Decryption Utilities (Updated) ---

/**
 * Encrypts data using AES-256-GCM with the provided key.
 * Prepends IV to the ciphertext. Salt is no longer needed.
 */
async function encryptData(data: string, key: Buffer): Promise<string> {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();

    // Prepend IV and tag to the encrypted data (hex encoded)
    // Salt is no longer prepended
    return iv.toString('hex') + tag.toString('hex') + encrypted;
}

/**
 * Decrypts data encrypted with AES-256-GCM using the provided key.
 * Assumes IV and auth tag are prepended to the ciphertext.
 */
async function decryptData(encryptedHex: string, key: Buffer): Promise<string> {
    // Adjust offsets as salt is removed
    const iv = Buffer.from(encryptedHex.substring(0, IV_LENGTH * 2), 'hex');
    const tag = Buffer.from(encryptedHex.substring(IV_LENGTH * 2, (IV_LENGTH + TAG_LENGTH) * 2), 'hex');
    const encrypted = encryptedHex.substring((IV_LENGTH + TAG_LENGTH) * 2);

    // Key is provided directly, no derivation needed
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// --- Data Access Functions (Updated) ---

/**
 * Initializes the database, creating or loading the encrypted file.
 * Ensures encryption key is available.
 */
async function initializeDatabase(): Promise<void> {
    let key: Buffer;
    try {
        key = await ensureEncryptionKey(); // Get key first
    } catch (keyError) {
        console.error('Failed to ensure encryption key:', keyError);
        throw new Error('Critical error: Could not obtain encryption key.'); // Propagate critical error
    }

    // If key retrieval succeeded, proceed with file operations
    try {
        await fs.access(dbPath);
        console.log('Database file exists. Loading...');
        const encryptedContent = await fs.readFile(dbPath, 'utf-8');

        if (!encryptedContent.trim()) {
            console.log('Database file is empty. Initializing with empty documents.');
            const adapter = new JSONFile<DataStore>(dbPath); // Still need adapter
            db = new Low(adapter, { documents: [] });
            // Save immediately to ensure the file has *some* valid (encrypted) content
            // Use the already retrieved key
            const initialJsonString = JSON.stringify(db.data);
            const initialEncryptedContent = await encryptData(initialJsonString, key);
            await fs.writeFile(dbPath, initialEncryptedContent, 'utf-8');
            console.log('Initialized empty database file.');
            return;
        }

        // Decrypt using the retrieved key
        const decryptedJson = await decryptData(encryptedContent, key);
        const initialData: DataStore = JSON.parse(decryptedJson);

        const adapter = new JSONFile<DataStore>(dbPath); // Adapter for Lowdb
        db = new Low(adapter, initialData); // Initialize with decrypted data
        console.log(`Loaded ${db.data?.documents?.length ?? 0} documents.`);

    } catch (error: any) { // Catch file access/read/parse errors
        if (error.code === 'ENOENT') {
            console.log('Database file not found. Creating and initializing...');
            const adapter = new JSONFile<DataStore>(dbPath);
            db = new Low(adapter, { documents: [] });
            // Need to save the empty state encrypted, use the key we already have
            try {
                 const initialJsonString = JSON.stringify(db.data);
                 const initialEncryptedContent = await encryptData(initialJsonString, key);
                 await fs.writeFile(dbPath, initialEncryptedContent, 'utf-8');
                 console.log('New database file created and initialized.');
            } catch (saveError) {
                 console.error('Failed to save initial empty database:', saveError);
                 // If we can't save the initial file, it's a critical state
                 throw new Error('Failed to create initial database file.');
            }
        } else {
            console.error('Error initializing database (file ops/decrypt/parse): ', error);
            // Decryption errors or JSON parse errors will land here too
            throw new Error('Failed to initialize database.');
        }
    }
}

/**
 * Loads all documents from the store.
 * Initializes the DB if it hasn't been already.
 */
export async function loadDocuments(): Promise<Document[]> {
    if (!db) {
        try {
            await initializeDatabase();
        } catch (initError) {
            console.error("DATABASE INITIALIZATION FAILED:", initError);
            // If init fails (e.g., keychain error, file write error), we cannot proceed safely.
            // Re-throwing allows the caller (IPC handler) to potentially inform the renderer.
            throw initError;
        }
    }
    // Check db and db.data again after potential initialization
    if (!db || !db.data) {
        console.error("Database not available or data missing after initialization attempt. Returning empty array.");
        return [];
    }
    return db.data.documents || [];
}

/**
 * Saves the entire documents array to the encrypted store.
 * Ensures encryption key is available.
 */
export async function saveDocuments(documents: Document[]): Promise<void> {
    let key: Buffer;
    try {
        key = await ensureEncryptionKey(); // Get key first
    } catch (keyError) {
        console.error('Failed to ensure encryption key during save:', keyError);
        throw new Error('Critical error: Could not obtain encryption key for saving.');
    }

    // If key retrieval succeeded, proceed with saving
    try {
        // Ensure DB instance is ready, especially if initializing for the first time
        if (!db) {
            console.warn('DB instance not ready during save, setting up lowdb instance...');
            // Run initialization logic minimally to set up Lowdb instance,
            // but avoid redundant file reads/decryption if possible.
            const adapter = new JSONFile<DataStore>(dbPath);
            // Initialize with the data we are about to save
            db = new Low(adapter, { documents });
            console.log('DB instance initialized for saving.');
        }
        // If db is still null after initialization attempt, throw.
        if (!db) {
            throw new Error("Database could not be initialized for saving.");
        }

        db.data = { documents }; // Update in-memory data first
        const jsonString = JSON.stringify(db.data);

        // Encrypt using the retrieved key
        const encryptedContent = await encryptData(jsonString, key);

        // Use fs.writeFile directly
        await fs.writeFile(dbPath, encryptedContent, 'utf-8');
        console.log(`Saved ${documents.length} documents (encrypted with keychain key).`);

    } catch (error) { // Catch errors during db setup, stringify, encrypt, write
        console.error('Error saving documents:', error);
        throw new Error('Failed to save documents.');
    }
}

// Initialize DB on module load
initializeDatabase().catch(error => {
    console.error("Failed to initialize database on startup:", error);
    // Handle critical initialization failure - maybe show an error dialog and quit?
    // Consider using dialog.showErrorBox(...)
    // app.quit();
}); 