import { contextBridge, ipcRenderer, clipboard } from 'electron';

console.log('--- Preload Script (preload.ts) Starting ---');

// Define the APIs we want to expose
const electronAPI = {
  clipboard: {
    writeText: (text: string) => {
      console.log('[Preload] Writing to clipboard:', text);
      return clipboard.writeText(text);
    }
  },
  ipc: {
    send: (channel: string, data: any) => {
      const validChannels = [
        'copy-to-clipboard',
        'show-overlay',
        'hide-overlay',
        'search-documents',
        'open-document'
      ];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      } else {
        console.warn(`Blocked send on invalid channel: ${channel}`);
      }
    },
    on: (channel: string, func: (...args: any[]) => void) => {
      const validChannels = [
        'search-results',
        'document-opened',
        'error'
      ];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    removeListener: (channel: string, func: (...args: any[]) => void) => {
      const validChannels = [
        'search-results',
        'document-opened',
        'error'
      ];
      if (validChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, func);
      }
    }
  }
};

// Expose the APIs
try {
  console.log('Exposing Electron APIs to renderer...');
  
  contextBridge.exposeInMainWorld('electronClipboard', electronAPI.clipboard);
  console.log('Clipboard API exposed successfully');
  
  contextBridge.exposeInMainWorld('ipc', electronAPI.ipc);
  console.log('IPC API exposed successfully');
  
  console.log('All APIs exposed successfully');
} catch (error) {
  console.error('Failed to expose APIs:', error);
}

console.log('--- Preload Script (preload.ts) Finished ---'); 