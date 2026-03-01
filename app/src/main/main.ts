import {
  app,
  BrowserWindow,
  session,
  globalShortcut,
  ipcMain,
  shell,
  Menu,
  dialog,
  clipboard,
  systemPreferences,
} from "electron";
import * as fs from "fs/promises";
import * as crypto from "crypto";
import { exec } from "child_process";
import {
  loadSettings,
  saveSettings,
  AppSettings,
  DEFAULT_SETTINGS,
} from "./settings";
// Import the simplified store functions
import { loadDocuments, saveDocuments } from "./secureStore";

// Define Document type again if needed here, or import if shared
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

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let mainWindow: BrowserWindow | null = null;
let appSettings: AppSettings = DEFAULT_SETTINGS;

// Load settings on app start (no changes needed here)
const loadAppSettings = () => {
  appSettings = loadSettings();
  console.log("Loaded app settings:", appSettings);
};

// Function to register global shortcut (no changes needed here)
const registerGlobalShortcut = () => {
  globalShortcut.unregisterAll();
  const shortcut = appSettings.globalShortcut;
  const ret = globalShortcut.register(shortcut, toggleWindow);
  if (!ret) {
    console.error(`Global shortcut registration failed for: ${shortcut}`);
  } else {
    console.log(`Global shortcut registered successfully: ${shortcut}`);
  }
};

// Function to create the main window (no changes needed here, CSP was already simplified)
function createWindow() {
  console.log("Creating main window...");
  const preloadScriptPath = MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY;
  console.log("Preload script path:", preloadScriptPath);

  const webPreferencesConfig = {
    nodeIntegration: false,
    contextIsolation: true,
    preload: preloadScriptPath,
    webSecurity: true,
    sandbox: true,
  };

  mainWindow = new BrowserWindow({
    width: 760,
    height: 480,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: webPreferencesConfig,
  });

  // Load the index.html of the app.
  console.log(`Loading URL: ${MAIN_WINDOW_WEBPACK_ENTRY}`);
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Configure CSP
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          !app.isPackaged
            ? "default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-eval' 'unsafe-inline' data:; connect-src 'self' http://localhost:* ws://localhost:*; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:;"
            : "default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-inline' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:;",
        ],
      },
    });
  });

  // Open DevTools only when not packaged
  if (!app.isPackaged) {
    console.log("Opening DevTools...");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  mainWindow.webContents.on("did-finish-load", () => {
    console.log("Window loaded, checking if preload APIs are available...");
    mainWindow?.webContents.executeJavaScript(`
       console.log('Window APIs:', {
         electronClipboard: typeof window.electronClipboard,
         ipc: typeof window.ipc
       });
     `);
    // Optionally, send initial documents on load?
    // Or wait for renderer to request them.
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.on("blur", () => {
    // Hide on blur
    // Add a small delay before hiding to allow external actions (like opening a link) to complete
    setTimeout(() => {
      if (mainWindow && !mainWindow.webContents.isDevToolsFocused()) {
        console.log("Main window blurred, hiding after delay...");
        mainWindow.hide();
      }
    }, 150); // 150ms delay
  });

  console.log("Main window created successfully.");
}

// Touch ID authentication gate
let isAuthenticating = false;
let lastAuthTime = 0;
const AUTH_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

async function showWindowWithAuth() {
  if (!mainWindow) return;
  if (isAuthenticating) return;

  isAuthenticating = true;
  try {
    const now = Date.now();
    const withinGracePeriod = now - lastAuthTime < AUTH_TIMEOUT_MS;

    if (appSettings.biometricEnabled && process.platform === "darwin" && !withinGracePeriod) {
      await systemPreferences.promptTouchID("Unlock Cocoon");
      lastAuthTime = Date.now();
    }
    mainWindow.show();
    mainWindow.focus();
  } catch {
    // User cancelled Touch ID or not available — do not show window
    console.log("[Auth] Touch ID cancelled or unavailable.");
  } finally {
    isAuthenticating = false;
  }
}

// Function to toggle window
function toggleWindow() {
  console.log("toggleWindow function called.");
  if (!mainWindow) {
    console.log("toggleWindow: mainWindow is null, returning.");
    return;
  }
  if (mainWindow.isVisible()) {
    console.log("toggleWindow: Window is visible, hiding.");
    mainWindow.hide();
  } else {
    console.log("toggleWindow: Window is hidden, showing via auth.");
    showWindowWithAuth();
  }
}

// Function to create app menu (no changes needed here)
function createAppMenu() {
  const isMac = process.platform === "darwin";

  const template = [
    // App menu (macOS only)
    ...(isMac
      ? [
        {
          label: app.name,
          submenu: [
            { role: "about" },
            { type: "separator" },
            {
              label: "Settings",
              click: () => {
                // Tell renderer to show settings
                if (mainWindow) {
                  mainWindow.webContents.send("open-settings");

                  // Show window if it's hidden
                  if (!mainWindow.isVisible()) {
                    showWindowWithAuth();
                  }
                }
              },
            },
            { type: "separator" },
            { role: "quit" },
          ],
        },
      ]
      : []),

    // For non-macOS, add a simple File menu with settings
    ...(!isMac
      ? [
        {
          label: "File",
          submenu: [
            {
              label: "Settings",
              click: () => {
                if (mainWindow) {
                  mainWindow.webContents.send("open-settings");

                  if (!mainWindow.isVisible()) {
                    showWindowWithAuth();
                  }
                }
              },
            },
            { type: "separator" },
            { role: "quit" },
          ],
        },
      ]
      : []),

    // Edit menu (include standard roles)
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template as any);
  Menu.setApplicationMenu(menu);
}

// Function to apply settings (simplified - no tray logic needed)
function applyAppSettings() {
  app.setLoginItemSettings({ openAtLogin: appSettings.launchAtStartup });
  console.log(`Launch at startup set to: ${appSettings.launchAtStartup}`);
  if (process.platform === "darwin") {
    if (appSettings.showInDock) {
      app.dock.show();
    } else {
      app.dock.hide();
    }
  }
}

// --- IPC Handlers (Reverted to simple versions) ---

// Handle request to load documents
ipcMain.handle("load-documents", async () => {
  try {
    console.log("[IPC] Received load-documents request");
    // Use the simplified loadDocuments from secureStore
    const documents = await loadDocuments();
    console.log(`[IPC] Sending ${documents.length} documents to renderer.`);
    return documents;
  } catch (error) {
    console.error("[IPC] Error loading documents:", error);
    return []; // Return empty array on error
  }
});

// Handle request to save documents
ipcMain.handle("save-documents", async (_event, documents: Document[]): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`[IPC] Received save-documents request with ${documents.length} documents.`);
    await saveDocuments(documents);
    console.log('[IPC] Documents saved successfully.');
    return { success: true };
  } catch (error) {
    console.error('[IPC] Error saving documents:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Handle settings IPC (no changes needed here)
ipcMain.handle("get-settings", async () => {
  return appSettings;
});
ipcMain.handle("save-settings", async (_event, newSettings: AppSettings) => {
  try {
    const success = saveSettings(newSettings);
    if (!success) { throw new Error('Failed to save settings file'); }
    appSettings = newSettings;
    applyAppSettings();
    registerGlobalShortcut();
    console.log('[IPC] Settings saved and applied successfully.');
    return { success: true };
  } catch (error) {
    console.error('[IPC] Error saving/applying settings:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Encryption helpers for export/import
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 600_000, 32, "sha256");
}

function encryptData(plaintext: string, password: string): string {
  const salt = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const key = deriveKey(password, salt);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  const backup = {
    version: 1,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ciphertext: encrypted.toString("base64"),
  };
  return JSON.stringify(backup, null, 2);
}

function decryptData(backupJson: string, password: string): string {
  const backup = JSON.parse(backupJson);
  if (backup.version !== 1) throw new Error("Unsupported backup version");

  const salt = Buffer.from(backup.salt, "base64");
  const iv = Buffer.from(backup.iv, "base64");
  const tag = Buffer.from(backup.tag, "base64");
  const ciphertext = Buffer.from(backup.ciphertext, "base64");
  const key = deriveKey(password, salt);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

// Handle Export Data (encrypted)
ipcMain.handle("export-data", async (_event, password: string) => {
  try {
    if (!password) {
      return { success: false, error: "Password is required for export" };
    }

    const { filePath } = await dialog.showSaveDialog({
      title: "Export Cocoon Data",
      defaultPath: "cocoon_backup.cocoon",
      filters: [
        { name: "Cocoon Backup", extensions: ["cocoon"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (filePath) {
      console.log(`[IPC] Exporting encrypted data to: ${filePath}`);
      const documents = await loadDocuments();
      const plaintext = JSON.stringify({ documents });
      const encrypted = encryptData(plaintext, password);
      await fs.writeFile(filePath, encrypted, "utf-8");
      return { success: true };
    }
    return { success: false, error: "Export cancelled" };
  } catch (error) {
    console.error("[IPC] Error exporting data:", error);
    return { success: false, error: (error as Error).message };
  }
});

// Handle Import Data (supports both encrypted .cocoon and legacy plaintext .json)
ipcMain.handle("import-data", async (_event, passwordOrOpts?: string | { password: string; filePath: string }) => {
  // If called with password+filePath object, this is the second call after the user entered a password
  const isRetryWithPassword = typeof passwordOrOpts === "object" && passwordOrOpts !== null;
  const password = isRetryWithPassword ? passwordOrOpts.password : (typeof passwordOrOpts === "string" ? passwordOrOpts : undefined);
  const providedFilePath = isRetryWithPassword ? passwordOrOpts.filePath : undefined;
  try {
    let filePath = providedFilePath;

    if (!filePath) {
      const { filePaths } = await dialog.showOpenDialog({
        title: "Import Cocoon Data",
        filters: [
          { name: "Cocoon Backup", extensions: ["cocoon"] },
          { name: "JSON Files", extensions: ["json"] },
          { name: "All Files", extensions: ["*"] },
        ],
        properties: ["openFile"],
      });
      if (filePaths && filePaths.length > 0) {
        filePath = filePaths[0];
      }
    }

    if (filePath) {
      console.log(`[IPC] Importing data from: ${filePath}`);

      const fileContent = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(fileContent);

      let data: { documents: Document[] };

      // Detect format: encrypted (has ciphertext field) vs legacy (has documents array)
      if (parsed.ciphertext) {
        // Encrypted format
        if (!password) {
          return { success: false, error: "Password is required for encrypted backup", needsPassword: true, filePath };
        }
        try {
          const decrypted = decryptData(fileContent, password);
          data = JSON.parse(decrypted);
        } catch {
          return { success: false, error: "Incorrect password or corrupted backup file" };
        }
      } else if (parsed.documents && Array.isArray(parsed.documents)) {
        // Legacy plaintext format
        data = parsed;
      } else {
        throw new Error("Invalid backup file format.");
      }

      if (!data.documents || !Array.isArray(data.documents)) {
        throw new Error("Invalid backup data. Missing 'documents' array.");
      }

      // Merge: overwrite matching IDs, add new
      const currentDocs = await loadDocuments();
      const docMap = new Map(currentDocs.map(d => [d.id, d]));
      let addedCount = 0;
      let updatedCount = 0;

      for (const doc of data.documents) {
        if (docMap.has(doc.id)) {
          docMap.set(doc.id, doc);
          updatedCount++;
        } else {
          docMap.set(doc.id, doc);
          addedCount++;
        }
      }

      const mergedDocs = Array.from(docMap.values());
      await saveDocuments(mergedDocs);

      console.log(`[IPC] Import complete. Added: ${addedCount}, Updated: ${updatedCount}`);
      return { success: true, message: `Imported ${addedCount} new, updated ${updatedCount} documents.` };
    }
    return { success: false, error: "Import cancelled" };
  } catch (error) {
    console.error("[IPC] Error importing data:", error);
    return { success: false, error: (error as Error).message };
  }
});

// Handle clipboard clear
ipcMain.on("write-clipboard", (_event, text: string) => {
  clipboard.writeText(text);
});

ipcMain.on("clear-clipboard", () => {
  console.log("[IPC] Clearing clipboard");
  clipboard.writeText("");
});

// Handle other IPC (hide-window, open-external-link)
ipcMain.on("hide-window", (_event) => {
  console.log("[IPC] Received hide-window request");
  if (mainWindow) {
    mainWindow.hide();
  }
});

ipcMain.on("resize-window", (_event, { width, height }: { width: number; height: number }) => {
  if (mainWindow) {
    mainWindow.setSize(width, height, true);
    mainWindow.center();
  }
});

// Handle request to open external link using specified browser
ipcMain.on("open-external-link", async (_event, url: string) => {
  if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
    try {
      console.log(`[IPC] Opening external URL: ${url}`);

      // For macOS: Use the selected browser
      if (process.platform === "darwin") {
        const escapedUrl = url.replace(/"/g, '\\"');
        let command = "";

        // Determine which browser to use
        switch (appSettings.defaultBrowser.toLowerCase()) {
          case "chrome":
            command = `open -g -a "Google Chrome" "${escapedUrl}"`;
            break;
          case "firefox":
            command = `open -g -a "Firefox" "${escapedUrl}"`;
            break;
          case "safari":
            command = `open -g -a "Safari" "${escapedUrl}"`;
            break;
          case "edge":
            command = `open -g -a "Microsoft Edge" "${escapedUrl}"`;
            break;
          case "brave":
            command = `open -g -a "Brave Browser" "${escapedUrl}"`;
            break;
          default:
            // Use system default browser
            command = `open -g "${escapedUrl}"`;
        }

        exec(command, (error: Error | null, _stdout: string, _stderr: string) => { // eslint-disable-line @typescript-eslint/no-unused-vars
          if (error) {
            console.error(
              `[IPC] Error opening URL with command: ${error.message}`,
            );
            console.log("[IPC] Attempting fallback with shell.openExternal");
            shell.openExternal(url, { activate: true });
            return;
          }
        });
      } else {
        // For non-macOS: Use standard shell.openExternal
        await shell.openExternal(url, { activate: true });
        console.log(
          `[IPC] URL opened successfully with shell.openExternal: ${url}`,
        );
      }
    } catch (error) {
      console.error(`[IPC] Failed to open URL ${url}:`, error);
    }
  } else {
    console.warn(`[IPC] Received invalid URL to open: ${url}`);
  }
});

// --- App Lifecycle Events (Simplified Startup) ---

app.on("ready", () => {
  console.log("App ready, loading settings and creating window...");
  loadAppSettings();
  applyAppSettings(); // Apply initial settings
  createWindow(); // Create window directly
  createAppMenu();
  registerGlobalShortcut();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("will-quit", () => {
  console.log("App will quit, unregistering shortcuts.");
  globalShortcut.unregisterAll();
});
