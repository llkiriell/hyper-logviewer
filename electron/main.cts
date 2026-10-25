import {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  ipcMain,
  nativeTheme,
  shell,
} from 'electron';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DEV_URL = process.env.LOGVIEWER_DEV_URL ?? null;
const DIST_INDEX = path.join(__dirname, '..', 'dist', 'index.html');
const IS_MAC = process.platform === 'darwin';

let mainWindow: BrowserWindow | null = null;

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 700,
    minHeight: 450,
    title: 'Hyper LogViewer',
    titleBarStyle: IS_MAC ? 'hiddenInset' : 'default',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#191919' : '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (DEV_URL) {
    void win.loadURL(DEV_URL);
  } else {
    void win.loadFile(DIST_INDEX);
  }

  win.on('closed', () => {
    mainWindow = null;
  });

  return win;
}

app.whenReady().then(() => {
  mainWindow = createWindow();

  ipcMain.on('logviewer:theme', (_event, theme: 'light' | 'dark') => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setBackgroundColor(theme === 'dark' ? '#191919' : '#ffffff');
    }
  });

  ipcMain.handle('logviewer:open-file-dialog', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Open Log File',
      filters: [
        { name: 'Log & Text Files', extensions: ['log', 'txt', 'out', 'err', 'json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile', 'multiSelections'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths;
  });

  ipcMain.handle('logviewer:read-file', async (_event, filePath: string) => {
    try {
      const content = await readFile(filePath, 'utf8');
      return { ok: true, content };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: message };
    }
  });

  ipcMain.handle('logviewer:read-clipboard', () => {
    return clipboard.readText();
  });

  ipcMain.handle('logviewer:open-external', async (_event, url: string) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      await shell.openExternal(url);
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (!IS_MAC) {
    app.quit();
  }
});
