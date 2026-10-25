import { createTab } from '../tabs.ts';
import { desktop } from './desktop.ts';

let clipboardCounter = 1;

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export async function openFileByPath(filePath: string): Promise<boolean> {
  if (!desktop?.readFile) return false;

  const res = await desktop.readFile(filePath);
  if (!res.ok || res.content === undefined) {
    console.error('Failed to read file:', res.error);
    return false;
  }

  const fileName = filePath.split(/[/\\]/).pop() ?? 'log.log';
  createTab({
    title: fileName,
    content: res.content,
    kind: 'file',
    filePath,
  });
  return true;
}

export async function openNativeFileDialog(): Promise<number> {
  if (desktop?.openFileDialog) {
    const paths = await desktop.openFileDialog();
    if (!paths || paths.length === 0) return 0;

    let opened = 0;
    for (const p of paths) {
      const ok = await openFileByPath(p);
      if (ok) opened++;
    }
    return opened;
  }
  return 0;
}

export async function openFileObjects(files: FileList | File[]): Promise<number> {
  let opened = 0;
  const list = Array.from(files);

  for (const file of list) {
    let nativePath = '';
    if (desktop?.getPathForFile) {
      try {
        nativePath = desktop.getPathForFile(file);
      } catch {
        nativePath = '';
      }
    }
    if (!nativePath) {
      nativePath = (file as unknown as { path?: string }).path ?? '';
    }

    if (desktop && nativePath) {
      const ok = await openFileByPath(nativePath);
      if (ok) {
        opened++;
        continue;
      }
    }

    // Fallback: read directly through HTML5 File API
    try {
      const content = await file.text();
      createTab({
        title: file.name,
        content,
        kind: 'file',
        size: file.size,
      });
      opened++;
    } catch (err) {
      console.error('Error reading dropped file:', err);
    }
  }

  return opened;
}

export async function pasteClipboardAsTab(placeholderLabel = 'Clipboard'): Promise<boolean> {
  let text = '';

  if (desktop?.readClipboard) {
    text = await desktop.readClipboard();
  } else if (navigator.clipboard) {
    try {
      text = await navigator.clipboard.readText();
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      return false;
    }
  }

  if (!text || text.trim().length === 0) {
    return false;
  }

  const title = `${placeholderLabel} #${clipboardCounter++}`;
  createTab({
    title,
    content: text,
    kind: 'clipboard',
  });
  return true;
}
