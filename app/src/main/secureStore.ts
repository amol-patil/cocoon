import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises'; // Use promises version
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node'; // Import adapter from lowdb/node
import * as crypto from 'crypto';

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
const DB_FILENAME = 'cocoon_data.enc';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES-GCM
const SALT_LENGTH = 16;
const TAG_LENGTH = 16; // For AES-GCM auth tag
const KEY_LENGTH = 32; // For AES-256
const PBKDF2_ITERATIONS = 100000; // Number of iterations for key derivation

// --- !!! IMPORTANT SECURITY NOTE !!! ---
// This uses a hardcoded password for simplicity in MVP.
// In a real application, this MUST be replaced with a secure method:
// - Prompting the user for a password on startup.
// - Storing the derived key securely in the OS keychain (e.g., using `keytar`).
// - NEVER hardcode passwords or keys directly in the source code.
const TEMP_PASSWORD = 'temporary-insecure-password-replace-me!';
// --- !!! END SECURITY NOTE !!! ---

// --- DB Setup ---
const dbPath = path.join(app.getPath('userData'), DB_FILENAME);
console.log('Database path:', dbPath);

// We'll manage the Lowdb instance manually with encryption
let db: Low<DataStore> | null = null;
// let derivedKey: Buffer | null = null; // Not currently used, can remove if needed

// --- Encryption/Decryption Utilities ---

/**
 * Derives a strong encryption key from a password and salt using PBKDF2.
 */
async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512', (err, key) => {
            if (err) reject(err);
            else resolve(key);
        });
    });
}

/**
 * Encrypts data using AES-256-GCM.
 * Prepends IV and salt to the ciphertext for later decryption.
 */
async function encryptData(data: string, password: string): Promise<string> {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = await deriveKey(password, salt);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();

    // Prepend salt, IV, and tag to the encrypted data (hex encoded)
    return salt.toString('hex') + iv.toString('hex') + tag.toString('hex') + encrypted;
}

/**
 * Decrypts data encrypted with AES-256-GCM.
 * Assumes salt, IV, and auth tag are prepended to the ciphertext.
 */
async function decryptData(encryptedHex: string, password: string): Promise<string> {
    const salt = Buffer.from(encryptedHex.substring(0, SALT_LENGTH * 2), 'hex');
    const iv = Buffer.from(encryptedHex.substring(SALT_LENGTH * 2, (SALT_LENGTH + IV_LENGTH) * 2), 'hex');
    const tag = Buffer.from(encryptedHex.substring((SALT_LENGTH + IV_LENGTH) * 2, (SALT_LENGTH + IV_LENGTH + TAG_LENGTH) * 2), 'hex');
    const encrypted = encryptedHex.substring((SALT_LENGTH + IV_LENGTH + TAG_LENGTH) * 2);

    const key = await deriveKey(password, salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// --- Data Access Functions ---

/**
 * Initializes the database, creating or loading the encrypted file.
 */
async function initializeDatabase(): Promise<void> {
    try {
        await fs.access(dbPath);
        console.log('Database file exists. Loading...');
        const encryptedContent = await fs.readFile(dbPath, 'utf-8');
        if (!encryptedContent.trim()) {
             console.log('Database file is empty. Initializing...');
             // Create an adapter instance even if saving empty
             const adapter = new JSONFile<DataStore>(dbPath);
             db = new Low(adapter, { documents: [] });
             await saveDocuments([]); // Save empty array encrypted
             return;
        }
        const decryptedJson = await decryptData(encryptedContent, TEMP_PASSWORD);
        const initialData: DataStore = JSON.parse(decryptedJson);
        const adapter = new JSONFile<DataStore>(dbPath); // Adapter for Lowdb
        db = new Low(adapter, initialData); // Initialize with decrypted data
        // No need to call db.read() here as we initialize with data
        console.log(`Loaded ${db.data?.documents?.length ?? 0} documents.`);

    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log('Database file not found. Creating and initializing...');
            const adapter = new JSONFile<DataStore>(dbPath);
            db = new Low(adapter, { documents: [] });
            // Don't write unencrypted here, saveDocuments will handle initial encryption
            await saveDocuments([]);
            console.log('New database file created and initialized.');
        } else {
             console.error('Error initializing database:', error);
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
        await initializeDatabase();
    }
    if (!db || !db.data) {
        throw new Error("Database failed to initialize.");
    }
    return db.data.documents || [];
}

/**
 * Saves the entire documents array to the encrypted store.
 */
export async function saveDocuments(documents: Document[]): Promise<void> {
    // Ensure DB is initialized. If initializeDatabase hasn't run or failed, this will try it.
    if (!db) {
        console.warn('DB not initialized during save attempt, initializing now...');
        await initializeDatabase();
    }
    // If db is still null after initialization attempt, throw.
    if (!db) { 
        throw new Error("Database could not be initialized for saving.");
    }

    db.data = { documents }; // Update in-memory data first
    const jsonString = JSON.stringify(db.data);
    const encryptedContent = await encryptData(jsonString, TEMP_PASSWORD);
    // Use fs.writeFile directly - Lowdb's write() isn't needed as we handle encryption
    await fs.writeFile(dbPath, encryptedContent, 'utf-8');
    console.log(`Saved ${documents.length} documents (encrypted).`);
}

// Initialize DB on module load
initializeDatabase().catch(error => {
    console.error("Failed to initialize database on startup:", error);
    // Handle critical initialization failure - maybe quit the app?
}); 