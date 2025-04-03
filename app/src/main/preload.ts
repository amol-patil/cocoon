import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('ipc', {
    // Example: send data from renderer to main
    // send: (channel: string, data: any) => {
    //     ipcRenderer.send(channel, data);
    // },
    // Example: receive data from main in renderer
    // on: (channel: string, func: (...args: any[]) => void) => {
    //     // Deliberately strip event as it includes `sender`
    //     ipcRenderer.on(channel, (event, ...args) => func(...args));
    // }
});

// You can expose other APIs here as needed
contextBridge.exposeInMainWorld('electronUtils', {
    // isDev: isDev // Example
}); 