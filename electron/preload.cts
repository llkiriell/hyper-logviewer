import { contextBridge, ipcRenderer, webUtils } from 'electron';

interface LogViewerApiBridge {
  platform: string;
  version: string;
  setTheme: (theme: 'light' | 'dark') => void;
  openFileDialog: () => Promise<string[] | null>;
  readFile: (filePath: string) => Promise<{ ok: boolean; content?: string; error?: string }>;
  readClipboard: () => Promise<string>;
  openExternal: (url: string) => Promise<void>;
  getPathForFile: (file: File) => string;
}

const api: LogViewerApiBridge = {
  platform: process.platform,
  version: '0.1.0',
  setTheme: (theme: 'light' | 'dark') => {
    ipcRenderer.send('logviewer:theme', theme);
  },
  openFileDialog: () => {
    return ipcRenderer.invoke('logviewer:open-file-dialog');
  },
  readFile: (filePath: string) => {
    return ipcRenderer.invoke('logviewer:read-file', filePath);
  },
  readClipboard: () => {
    return ipcRenderer.invoke('logviewer:read-clipboard');
  },
  openExternal: (url: string) => {
    return ipcRenderer.invoke('logviewer:open-external', url);
  },
  getPathForFile: (file: File) => {
    try {
      if (webUtils && typeof webUtils.getPathForFile === 'function') {
        return webUtils.getPathForFile(file);
      }
      return (file as unknown as { path?: string }).path ?? '';
    } catch {
      return (file as unknown as { path?: string }).path ?? '';
    }
  },
};

contextBridge.exposeInMainWorld('logviewer', api);
