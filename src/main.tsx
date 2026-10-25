import './app/styles/tokens.css';
import './app/styles/color.css';
import './app/styles/app.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App.tsx';
import { getPreferences, resolvedTheme } from './app/platform/preferences.ts';

// Apply theme before render to eliminate flash of unstyled content
const prefs = getPreferences();
const initialTheme = resolvedTheme(prefs.theme);
document.documentElement.dataset.theme = initialTheme;
document.documentElement.dataset.accent = prefs.accent;
document.documentElement.style.colorScheme = initialTheme;

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container #root not found.');
}

const root = createRoot(container);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
