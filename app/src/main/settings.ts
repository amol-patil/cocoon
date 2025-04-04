import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import * as isDev from 'electron-is-dev';

// Define settings interface
export interface AppSettings {
  globalShortcut: string;
  defaultBrowser: string; // 'system', 'chrome', 'firefox', 'safari', etc.
  theme: 'light' | 'dark' | 'system';
  launchAtStartup: boolean;
  showInDock: boolean;
}

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  globalShortcut: 'Control+Option+Space',
  defaultBrowser: 'chrome',
  theme: 'system',
  launchAtStartup: false,
  showInDock: true,
};

// Determine settings filename based on environment
const IS_DEV = !app.isPackaged;
const SETTINGS_FILENAME = IS_DEV ? 'settings-dev.json' : 'settings.json';
const settingsPath = path.join(app.getPath('userData'), SETTINGS_FILENAME);
console.log(`Using settings file: ${SETTINGS_FILENAME} at ${settingsPath}`);

// Load settings from file
export function loadSettings(): AppSettings {
  try {
    if (fs.existsSync(settingsPath)) {
      const rawData = fs.readFileSync(settingsPath, 'utf-8');
      const loadedSettings = JSON.parse(rawData) as Partial<AppSettings>;
      // Merge with defaults to ensure all keys exist
      return { ...DEFAULT_SETTINGS, ...loadedSettings };
    } else {
      // If file doesn't exist, return defaults and save them
      console.log('Settings file not found, using defaults and creating file.');
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
  } catch (error) {
    console.error('Error loading settings, using defaults:', error);
    return DEFAULT_SETTINGS; // Return defaults on any error
  }
}

// Save settings to file
export function saveSettings(settings: AppSettings): boolean {
  try {
    const data = JSON.stringify(settings, null, 2); // Pretty print JSON
    fs.writeFileSync(settingsPath, data, 'utf-8');
    console.log(`Settings saved successfully to ${settingsPath}`);
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

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