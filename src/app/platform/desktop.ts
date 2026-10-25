export interface LogViewerApi {
  platform: string;
  version: string;
  setTheme: (theme: 'light' | 'dark') => void;
  openFileDialog: () => Promise<string[] | null>;
  readFile: (filePath: string) => Promise<{ ok: boolean; content?: string; error?: string }>;
  readClipboard: () => Promise<string>;
  openExternal: (url: string) => Promise<void>;
  getPathForFile?: (file: File) => string;
}

export const desktop: LogViewerApi | null =
  typeof window !== 'undefined' && 'logviewer' in window
    ? (window as unknown as { logviewer: LogViewerApi }).logviewer
    : null;

export const isMac = desktop ? desktop.platform === 'darwin' : false;

export async function openExternalUrl(url: string): Promise<void> {
  if (desktop?.openExternal) {
    await desktop.openExternal(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
