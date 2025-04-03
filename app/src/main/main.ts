import { app, BrowserWindow, session, globalShortcut } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  console.log('Creating main window...'); // Log window creation start
  mainWindow = new BrowserWindow({
    width: 600, // Adjust size as needed
    height: 400,
    show: false, // Start hidden
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false, // Keep false for security
      contextIsolation: true, // Keep true for security
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY, // Use preload script path provided by webpack
      webSecurity: true,
    },
  });

  // Load the index.html of the app.
  console.log(`Loading URL: ${MAIN_WINDOW_WEBPACK_ENTRY}`); // Log URL loading
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Configure CSP
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          isDev
            ? "default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-eval' 'unsafe-inline' data:; connect-src 'self' http://localhost:* ws://localhost:*"
            : "default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-inline' data:"
        ]
      }
    });
  });

  // Open DevTools in development
  if (isDev) {
    console.log('Opening DevTools...'); // Log DevTools opening
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    console.log('Main window closed.'); // Log window close
    mainWindow = null;
  });

  mainWindow.on('blur', () => { // Hide on blur
    if (mainWindow && !mainWindow.webContents.isDevToolsFocused()) {
      console.log('Main window blurred, but NOT hiding (temporary debug).'); // Log blur but don't hide
      // mainWindow.hide(); // << Temporarily commented out
    }
  });

  console.log('Main window created successfully.'); // Log window creation end
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