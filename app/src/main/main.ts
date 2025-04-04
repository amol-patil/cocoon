import { app, BrowserWindow, session, globalShortcut, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as isDev from 'electron-is-dev';
import { loadDocuments, saveDocuments } from './secureStore';

// Define Document type again (needed for IPC typing)
interface DocumentField { [key: string]: string | undefined }
interface Document {
  id: string;
  type: string;
  defaultField: string;
  fields: DocumentField;
  fileLink: string;
}

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  console.log('Creating main window...');

  const preloadScriptPath = MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY;
  console.log('Preload script path:', preloadScriptPath);

  const webPreferencesConfig = {
    nodeIntegration: false,
    contextIsolation: true,
    preload: preloadScriptPath,
    webSecurity: true,
    sandbox: false
  };

  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
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
        'Content-Security-Policy': [
          isDev
            ? "default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-eval' 'unsafe-inline' data:; connect-src 'self' http://localhost:* ws://localhost:*; style-src 'self' 'unsafe-inline';"
            : "default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-inline' data:; style-src 'self' 'unsafe-inline';"
        ]
      }
    });
  });

  // Open DevTools in development
  if (isDev) {
    console.log('Opening DevTools...');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window loaded, checking if preload APIs are available...');
    mainWindow?.webContents.executeJavaScript(`
      console.log('Window APIs:', {
        electronClipboard: typeof window.electronClipboard,
        ipc: typeof window.ipc
      });
    `);
    // Optionally, send initial documents on load?
    // Or wait for renderer to request them.
  });

  mainWindow.on('closed', () => {
    console.log('Main window closed.');
    mainWindow = null;
  });

  mainWindow.on('blur', () => { // Hide on blur
    // Add a small delay before hiding to allow external actions (like opening a link) to complete
    setTimeout(() => {
         if (mainWindow && !mainWindow.webContents.isDevToolsFocused()) {
            console.log('Main window blurred, hiding after delay...');
            mainWindow.hide();
         }
    }, 150); // 150ms delay
  });

  console.log('Main window created successfully.');
}

function toggleWindow() {
  console.log('toggleWindow function called.'); // Log toggle function call
  if (!mainWindow) {
    console.log('toggleWindow: mainWindow is null, returning.');
    return;
  }
  if (mainWindow.isVisible()) {
    console.log('toggleWindow: Window is visible, hiding.');
    mainWindow.hide();
  } else {
    console.log('toggleWindow: Window is hidden, showing and focusing.');
    // TODO: Center window before showing?
    mainWindow.show();
    mainWindow.focus();
  }
}

// --- IPC Handlers ---

// Handle request to load documents
ipcMain.handle('load-documents', async (event) => {
  try {
    console.log('[IPC] Received load-documents request');
    const documents = await loadDocuments();
    console.log(`[IPC] Sending ${documents.length} documents to renderer.`);
    return documents;
  } catch (error) {
    console.error('[IPC] Error loading documents:', error);
    // Consider sending error back to renderer
    return []; // Return empty array on error for now
  }
});

// Handle request to save documents
ipcMain.handle('save-documents', async (event, documents: Document[]) => {
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

// Handle request to open external link using child_process for macOS
ipcMain.on('open-external-link', async (event, url: string) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        try {
            console.log(`[IPC] Opening external URL with custom approach: ${url}`);
            
            // For macOS: Use open command with specific options to force foreground
            if (process.platform === 'darwin') {
                const { exec } = require('child_process');
                
                // Escape URL for shell command
                const escapedUrl = url.replace(/"/g, '\\"');
                
                // -g = open in foreground, -a = specify application (Chrome)
                const command = `open -g -a "Google Chrome" "${escapedUrl}"`;
                
                exec(command, (error: any, stdout: string, stderr: string) => {
                    if (error) {
                        console.error(`[IPC] Error opening URL with open command: ${error.message}`);
                        event.sender.send('open-link-error', `Failed to open: ${error.message}`);
                        
                        // Fallback to shell.openExternal
                        console.log('[IPC] Attempting fallback with shell.openExternal');
                        shell.openExternal(url, { activate: true });
                        return;
                    }
                    
                    if (stderr) {
                        console.warn(`[IPC] Warning when opening URL: ${stderr}`);
                    }
                    
                    console.log(`[IPC] URL opened successfully with open command: ${url}`);
                });
            } else {
                // For non-macOS: Use standard shell.openExternal
                await shell.openExternal(url, { activate: true });
                console.log(`[IPC] URL opened successfully with shell.openExternal: ${url}`);
            }
        } catch (error) {
            console.error(`[IPC] Failed to open URL ${url}:`, error);
            event.sender.send('open-link-error', (error as Error).message);
        }
    } else {
        console.warn(`[IPC] Received invalid URL to open: ${url}`);
        event.sender.send('open-link-error', 'Invalid URL format');
    }
});

// --- App Lifecycle Events ---

app.on('ready', () => {
  console.log('App ready, creating window and registering shortcut...');
  createWindow();

  const shortcut = 'Control+Option+Space';
  const ret = globalShortcut.register(shortcut, toggleWindow);
  if (!ret) {
    console.error(`Global shortcut registration failed for: ${shortcut}`);
  } else {
    console.log(`Global shortcut registered successfully: ${shortcut}`);
  }
});

app.on('window-all-closed', () => {
  console.log('All windows closed.');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('App activated.');
  if (BrowserWindow.getAllWindows().length === 0) {
    console.log('No windows open, creating new one.');
    createWindow();
  }
});

app.on('will-quit', () => {
  console.log('App will quit, unregistering shortcuts.');
  globalShortcut.unregisterAll();
}); 