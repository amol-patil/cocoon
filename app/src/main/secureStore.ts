import { app } from "electron";
import * as path from "path";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

// --- Define Document structure ---
interface DataStore {
  documents: Document[];
}

// Define the type for our document items (matching renderer)
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
// Use .json extension for unencrypted data
const DB_FILENAME = IS_DEV ? "cocoon_data-dev.json" : "cocoon_data.json";

console.log(`Running in ${IS_DEV ? "DEVELOPMENT" : "PRODUCTION"} mode.`);
console.log(`Using data file: ${DB_FILENAME}`);

// --- Paths Setup ---
const dbPath = path.join(app.getPath("userData"), DB_FILENAME);
console.log("Database path:", dbPath);

// --- Database Setup ---

// Define the default data structure
const defaultData: DataStore = { documents: [] };

// Create adapter and database instance
const adapter = new JSONFile<DataStore>(dbPath);
// Initialize Lowdb
// We need to handle the case where the file doesn't exist yet
// or is empty, which Lowdb v7+ handles gracefully during the first read/write.
let db: Low<DataStore> | null = null;
let dbInitializationPromise: Promise<void> | null = null;

// Function to ensure DB is initialized
async function ensureDbInitialized(): Promise<Low<DataStore>> {
  if (db) {
    return db;
  }
  // Prevent race conditions during initialization
  if (!dbInitializationPromise) {
    dbInitializationPromise = (async () => {
      try {
        console.log("Initializing database instance...");
        const lowDbInstance = new Low(adapter, defaultData);
        // Attempt to read the file to load existing data or initialize with defaults
        await lowDbInstance.read();
        console.log(
          `Database read complete. Loaded ${lowDbInstance.data.documents.length} documents initially.`,
        );
        db = lowDbInstance;
      } catch (err) {
        console.error("Failed to initialize database:", err);
        // In case of error, reset promise to allow retrying later?
        dbInitializationPromise = null;
        // Depending on the error, db might be null here. Handle appropriately.
        // For now, rethrow to signal failure.
        throw new Error("Database initialization failed.");
      }
    })();
  }
  await dbInitializationPromise;

  if (!db) {
    // Check again after promise resolution
    throw new Error("Database initialization failed critically.");
  }
  return db;
}

// --- Data Access Functions (Exported) ---

/**
 * Loads all documents from the store.
 */
export async function loadDocuments(): Promise<Document[]> {
  try {
    const currentDb = await ensureDbInitialized();
    // Ensure data is loaded (might be redundant if read() was successful)
    // await currentDb.read();
    return currentDb.data.documents || [];
  } catch (error) {
    console.error("Error loading documents:", error);
    // Depending on requirements, return empty array or rethrow
    return [];
  }
}

/**
 * Saves the entire documents array to the store.
 */
export async function saveDocuments(documents: Document[]): Promise<void> {
  try {
    const currentDb = await ensureDbInitialized();
    currentDb.data = { documents }; // Update in-memory data
    await currentDb.write(); // Write changes to the JSON file
    console.log(`Saved ${documents.length} documents to ${dbPath}`);
  } catch (error) {
    console.error("Error saving documents:", error);
    throw new Error("Failed to save documents."); // Re-throw to indicate failure
  }
}

// Initialize eagerly - this will start the read process
// ensureDbInitialized().catch(err => {
//    console.error("Initial database load/init failed on startup:", err);
//    // Decide how to handle this - maybe app should quit or show error?
// });
