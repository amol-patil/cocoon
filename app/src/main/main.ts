import { app, BrowserWindow, session, globalShortcut } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as isDev from 'electron-is-dev';

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

  // Debug preload script loading
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window loaded, checking if preload APIs are available...');
    mainWindow?.webContents.executeJavaScript(`
      console.log('Window APIs:', {
        electronClipboard: typeof window.electronClipboard,
        ipc: typeof window.ipc
      });
    `);
  });

  mainWindow.on('closed', () => {
    console.log('Main window closed.');
    mainWindow = null;
  });

  mainWindow.on('blur', () => { // Hide on blur
    if (mainWindow && !mainWindow.webContents.isDevToolsFocused()) {
      console.log('Main window blurred, hiding...');
      mainWindow.hide();
    }
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

app.on('ready', () => {
  console.log('App ready, creating window and registering shortcut...'); // Log ready event
  createWindow();

  // Register global shortcut
  const shortcut = 'Control+Option+Space';
  const ret = globalShortcut.register(shortcut, toggleWindow);
  if (!ret) {
    console.error(`Global shortcut registration failed for: ${shortcut}`);
  } else {
    console.log(`Global shortcut registered successfully: ${shortcut}`);
  }
});

app.on('window-all-closed', () => {
  console.log('All windows closed.'); // Log all windows closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('App activated.'); // Log activate event
  if (BrowserWindow.getAllWindows().length === 0) {
    console.log('No windows open, creating new one.');
    createWindow();
  }
});

app.on('will-quit', () => {
  console.log('App will quit, unregistering shortcuts.'); // Log will quit
  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
}); 