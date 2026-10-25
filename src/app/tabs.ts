import { useSyncExternalStore } from 'react';
import { desktop } from './platform/desktop.ts';

export interface TabItem {
  id: string;
  title: string;
  kind: 'file' | 'clipboard' | 'segment';
  filePath?: string;
  size: number;
  content: string;
  linesCount: number;
  isPinned?: boolean;
}

interface TabState {
  tabs: TabItem[];
  activeId: string | null;
}

const listeners = new Set<() => void>();
let counter = 0;
const nextId = () => `tab_${Date.now().toString(36)}_${(counter++).toString(36)}`;

function countLines(text: string): number {
  if (!text) return 0;
  let count = 1;
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10) count++;
  }
  return count;
}

let state: TabState = {
  tabs: [],
  activeId: null,
};

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function getTabsState(): TabState {
  return state;
}

export function getActiveTab(): TabItem | null {
  if (!state.activeId) return state.tabs[0] ?? null;
  return state.tabs.find((t) => t.id === state.activeId) ?? state.tabs[0] ?? null;
}

export function createTab(params: {
  title: string;
  content: string;
  kind?: 'file' | 'clipboard' | 'segment';
  filePath?: string;
  size?: number;
  isPinned?: boolean;
}): TabItem {
  const id = nextId();
  const content = params.content;
  const size = params.size ?? new Blob([content]).size;
  const linesCount = countLines(content);

  const newTab: TabItem = {
    id,
    title: params.title,
    kind: params.kind ?? 'file',
    filePath: params.filePath,
    size,
    content,
    linesCount,
    isPinned: params.isPinned ?? false,
  };

  state = {
    tabs: [...state.tabs, newTab],
    activeId: id,
  };

  notify();
  return newTab;
}

export function updateTab(id: string, partial: Partial<TabItem>): void {
  state = {
    ...state,
    tabs: state.tabs.map((t) => (t.id === id ? { ...t, ...partial } : t)),
  };
  notify();
}

export function togglePinTab(id: string): void {
  const target = state.tabs.find((t) => t.id === id);
  if (!target) return;

  const nextPinned = !target.isPinned;
  const updatedTabs = state.tabs.map((t) =>
    t.id === id ? { ...t, isPinned: nextPinned } : t,
  );

  // Keep pinned tabs grouped at the beginning
  const pinned = updatedTabs.filter((t) => t.isPinned);
  const unpinned = updatedTabs.filter((t) => !t.isPinned);

  state = {
    ...state,
    tabs: [...pinned, ...unpinned],
  };
  notify();
}

export async function reloadTab(id: string): Promise<boolean> {
  const target = state.tabs.find((t) => t.id === id);
  if (!target || !target.filePath || !desktop?.readFile) return false;

  try {
    const res = await desktop.readFile(target.filePath);
    if (res.ok && res.content !== undefined) {
      updateTab(id, {
        content: res.content,
        size: new Blob([res.content]).size,
        linesCount: countLines(res.content),
      });
      return true;
    }
  } catch (err) {
    console.error('Failed to reload tab:', err);
  }
  return false;
}

export function closeTab(id: string): void {
  const index = state.tabs.findIndex((t) => t.id === id);
  if (index === -1) return;

  const nextTabs = state.tabs.filter((t) => t.id !== id);
  let nextActiveId = state.activeId;

  if (state.activeId === id) {
    if (nextTabs.length > 0) {
      const nextIndex = Math.min(index, nextTabs.length - 1);
      nextActiveId = nextTabs[nextIndex]!.id;
    } else {
      nextActiveId = null;
    }
  }

  state = {
    tabs: nextTabs,
    activeId: nextActiveId,
  };

  notify();
}

export function closeOtherTabs(id: string): void {
  const target = state.tabs.find((t) => t.id === id);
  if (!target) return;

  // Preserve targeted tab and any pinned tabs
  const preserved = state.tabs.filter((t) => t.id === id || t.isPinned);

  state = {
    tabs: preserved,
    activeId: id,
  };

  notify();
}

export function activateTab(id: string): void {
  if (state.activeId === id) return;
  state = {
    ...state,
    activeId: id,
  };
  notify();
}

export function moveTab(fromId: string, toIndex: number): void {
  const fromIndex = state.tabs.findIndex((t) => t.id === fromId);
  if (fromIndex === -1 || fromIndex === toIndex) return;

  const newTabs = [...state.tabs];
  const [removed] = newTabs.splice(fromIndex, 1);
  if (!removed) return;

  newTabs.splice(toIndex, 0, removed);
  state = {
    ...state,
    tabs: newTabs,
  };
  notify();
}

export function duplicateTab(id: string): void {
  const original = state.tabs.find((t) => t.id === id);
  if (!original) return;

  createTab({
    title: `${original.title} (Copy)`,
    content: original.content,
    kind: original.kind,
    filePath: original.filePath,
    size: original.size,
  });
}

export function useTabs(): TabState {
  return useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => listeners.delete(onStoreChange);
    },
    () => state,
  );
}
