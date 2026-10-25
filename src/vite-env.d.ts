/// <reference types="vite/client" />

import type { LogViewerApi } from './app/platform/desktop.ts';

declare global {
  interface Window {
    logviewer?: LogViewerApi;
  }
}
