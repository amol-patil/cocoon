// Declare the types for the APIs exposed via preload.ts
export {}; // Make this a module

declare global {
  interface Window {
    electronClipboard: {
      writeText: (text: string) => Promise<void>;
    };
    ipc: {
      send: (channel: string, data?: any) => void; // Make data optional
      on: (channel: string, func: (...args: any[]) => void) => void;
      removeListener: (channel: string, func: (...args: any[]) => void) => void;
      invoke: <T>(channel: string, ...args: any[]) => Promise<T>; // Add invoke signature
    };
    // Declare other preload APIs here if needed
    electronUtils?: any; // Add type for electronUtils if used
  }
} 