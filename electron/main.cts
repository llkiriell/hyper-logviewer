import {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  ipcMain,
  Menu,
  nativeTheme,
  shell,
} from 'electron';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DEV_URL = process.env.LOGVIEWER_DEV_URL ?? null;
const DIST_INDEX = path.join(__dirname, '..', 'dist', 'index.html');
const IS_MAC = process.platform === 'darwin';
const TITLE_BAR_HEIGHT = 48;
const APP_ID = 'app.hyperlogviewer.desktop';
const ICON = path.join(__dirname, '..', 'public', 'icon.png');

const THEMES = {
  light: { background: '#f8f8f7', symbols: '#5b5b5f' },
  dark: { background: '#202020', symbols: '#ececec' },
};

let mainWindow: BrowserWindow | null = null;

function createWindow(): BrowserWindow {
  const initialThemeName = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  const initialTheme = THEMES[initialThemeName];

  // Hide the default Electron application menu bar on all non-macOS platforms
  Menu.setApplicationMenu(null);

  const win = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 700,
    minHeight: 450,
    title: 'Hyper LogViewer',
    icon: ICON,
    backgroundColor: initialTheme.background,
    titleBarStyle: 'hidden',
    ...(IS_MAC
      ? { trafficLightPosition: { x: 14, y: 14 } }
      : {
          titleBarOverlay: {
            color: initialTheme.background,
            symbolColor: initialTheme.symbols,
            height: TITLE_BAR_HEIGHT,
          },
        }),
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
  app.setAppUserModelId(APP_ID);
  mainWindow = createWindow();

  ipcMain.on('logviewer:theme', (_event, theme: 'light' | 'dark') => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const t = THEMES[theme];
      mainWindow.setBackgroundColor(t.background);
      if (!IS_MAC && typeof mainWindow.setTitleBarOverlay === 'function') {
        mainWindow.setTitleBarOverlay({
          color: t.background,
          symbolColor: t.symbols,
          height: TITLE_BAR_HEIGHT,
        });
      }
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
