import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import * as isDev from 'electron-is-dev';

// Define settings interface
export interface AppSettings {
  globalShortcut: string;
  defaultBrowser: string; // 'system', 'chrome', 'firefox', 'safari', etc.
}

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  globalShortcut: 'CommandOrControl+Option+Space',
  defaultBrowser: 'chrome',
};

// Get the user data path
const getUserSettingsPath = (): string => {
  const userDataPath = isDev
    ? path.join(app.getAppPath(), 'userData') // Dev mode: store in app directory
    : app.getPath('userData'); // Prod mode: store in default user data location

  // Create directory if it doesn't exist
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  return path.join(userDataPath, 'settings.json');
};

// Load settings from disk
export const loadSettings = (): AppSettings => {
  try {
    const settingsPath = getUserSettingsPath();
    
    // If settings file doesn't exist, create it with defaults
    if (!fs.existsSync(settingsPath)) {
      fs.writeFileSync(settingsPath, JSON.stringify(DEFAULT_SETTINGS, null, 2));
      return { ...DEFAULT_SETTINGS };
    }
    
    // Read and parse settings
    const data = fs.readFileSync(settingsPath, 'utf8');
    const settings = JSON.parse(data) as Partial<AppSettings>;
    
    // Merge with defaults to ensure all properties exist
    return { ...DEFAULT_SETTINGS, ...settings };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return { ...DEFAULT_SETTINGS };
  }
};

// Save settings to disk
export const saveSettings = (settings: AppSettings): boolean => {
  try {
    const settingsPath = getUserSettingsPath();
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to save settings:', error);
    return false;
  }
};

// Update a specific setting
export const updateSetting = <K extends keyof AppSettings>(
  key: K, 
  value: AppSettings[K]
): boolean => {
  try {
    const currentSettings = loadSettings();
    const updatedSettings = { 
      ...currentSettings, 
      [key]: value 
    };
    return saveSettings(updatedSettings);
  } catch (error) {
    console.error(`Failed to update setting ${key}:`, error);
    return false;
  }
}; 