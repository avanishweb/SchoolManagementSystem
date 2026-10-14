import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  ping: () => Promise<string>;
  silentPrint: (options?: { deviceName?: string; silent?: boolean }) => Promise<{ success: boolean; failureReason?: string }>;
  getPrinters: () => Promise<any[]>;
}

const api: ElectronAPI = {
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  getPlatform: () => ipcRenderer.invoke('app:get-platform'),
  ping: () => ipcRenderer.invoke('app:ping'),
  silentPrint: (options) => ipcRenderer.invoke('print:silent', options),
  getPrinters: () => ipcRenderer.invoke('print:get-printers'),
};

// Safely expose limited API to renderer process under window.electronAPI
contextBridge.exposeInMainWorld('electronAPI', api);
