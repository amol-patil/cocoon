import { contextBridge, ipcRenderer, clipboard } from "electron";

console.log("--- Preload Script (preload.ts) Starting ---");

// Define the APIs we want to expose
const electronAPI = {
  clipboard: {
    writeText: (text: string) => {
      console.log("[Preload] Writing to clipboard:", text);
      return clipboard.writeText(text);
    },
  },
  ipc: {
    // Send (fire-and-forget)
    send: (channel: string, data: any) => {
      const validSendChannels = ["open-external-link", "hide-window"]; // Whitelist send channels
      if (validSendChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      } else {
        console.warn(`Blocked send on invalid channel: ${channel}`);
      }
    },
    // Receive (Main -> Renderer)
    on: (channel: string, func: (...args: any[]) => void) => {
      const validReceiveChannels = [
        "search-results",
        "document-opened",
        "error",
        "open-link-error",
        "open-settings",
      ]; // Whitelist receive channels
      if (validReceiveChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    // Remove listener
    removeListener: (channel: string, func: (...args: any[]) => void) => {
      const validReceiveChannels = [
        "search-results",
        "document-opened",
        "error",
        "open-link-error",
        "open-settings",
      ];
      if (validReceiveChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, func);
      }
    },
    // Invoke (Renderer -> Main -> Renderer)
    invoke: async (channel: string, ...args: any[]): Promise<any> => {
      const validInvokeChannels = [
        "load-documents",
        "save-documents",
        "get-settings",
        "save-settings",
      ]; // Add settings channels
      if (validInvokeChannels.includes(channel)) {
        return await ipcRenderer.invoke(channel, ...args);
      } else {
        console.warn(`Blocked invoke on invalid channel: ${channel}`);
        throw new Error(`Invalid IPC invoke channel: ${channel}`);
      }
    },
  },
};

// Expose the APIs
try {
  console.log("Exposing Electron APIs to renderer...");
  contextBridge.exposeInMainWorld("electronClipboard", electronAPI.clipboard);
  console.log("Clipboard API exposed successfully");
  contextBridge.exposeInMainWorld("ipc", electronAPI.ipc);
  console.log("IPC API exposed successfully");
  console.log("All APIs exposed successfully");
} catch (error) {
  console.error("Failed to expose APIs:", error);
}

console.log("--- Preload Script (preload.ts) Finished ---");
