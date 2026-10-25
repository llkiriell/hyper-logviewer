import { contextBridge, ipcRenderer, webUtils } from 'electron';

interface LogViewerApiBridge {
  platform: string;
  version: string;
  setTheme: (theme: 'light' | 'dark') => void;
  openFileDialog: () => Promise<string[] | null>;
  readFile: (filePath: string) => Promise<{ ok: boolean; content?: string; error?: string }>;
  readClipboard: () => Promise<string>;
  openExternal: (url: string) => Promise<void>;
  showItemInFolder: (filePath: string) => Promise<{ ok: boolean; error?: string }>;
  selectFolderDialog: () => Promise<string | null>;
  readDirLogs: (dirPath: string) => Promise<{
    ok: boolean;
    error?: string;
    files: Array<{ name: string; fullPath: string; size: number; mtime: number }>;
  }>;
  getPathForFile: (file: File) => string;
  getInitialFile: () => Promise<string | null>;
  onOpenFile: (callback: (filePath: string) => void) => () => void;
}

const api: LogViewerApiBridge = {
  platform: process.platform,
  version: '0.1.0-beta.1',
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
  showItemInFolder: (filePath: string) => {
    return ipcRenderer.invoke('logviewer:show-item-in-folder', filePath);
  },
  selectFolderDialog: () => {
    return ipcRenderer.invoke('logviewer:select-folder-dialog');
  },
  readDirLogs: (dirPath: string) => {
    return ipcRenderer.invoke('logviewer:read-dir-logs', dirPath);
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
  getInitialFile: () => {
    return ipcRenderer.invoke('logviewer:get-initial-file');
  },
  onOpenFile: (callback: (filePath: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, filePath: string) => {
      callback(filePath);
    };
    ipcRenderer.on('logviewer:open-file', handler);
    return () => {
      ipcRenderer.removeListener('logviewer:open-file', handler);
    };
  },
};

contextBridge.exposeInMainWorld('logviewer', api);
