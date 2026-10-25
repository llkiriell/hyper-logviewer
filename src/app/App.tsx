import { useEffect, useState } from 'react';
import {
  IconClipboard,
  IconFolderOpen,
  IconMoon,
  IconSettings,
  IconSun,
} from '@tabler/icons-react';
import { useTranslation } from './i18n/index.ts';
import { desktop } from './platform/desktop.ts';
import {
  resolvedTheme,
  setPreferences,
  usePreferences,
} from './platform/preferences.ts';
import { Logo } from './components/primitives.tsx';
import { SettingsDialog } from './components/settings/SettingsDialog.tsx';

function useThemeManager() {
  const prefs = usePreferences();

  useEffect(() => {
    const apply = () => {
      const active = resolvedTheme(prefs.theme);
      document.documentElement.dataset.theme = active;
      document.documentElement.dataset.accent = prefs.accent;
      document.documentElement.style.colorScheme = active;
      if (desktop?.setTheme) {
        desktop.setTheme(active);
      }
    };

    apply();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [prefs.theme, prefs.accent]);
}

export function App() {
  const { t } = useTranslation();
  const prefs = usePreferences();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useThemeManager();

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === ',') {
          event.preventDefault();
          setSettingsOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const next = resolvedTheme(prefs.theme) === 'dark' ? 'light' : 'dark';
    setPreferences({ theme: next });
  };

  const handleOpenFile = async () => {
    if (desktop?.openFileDialog) {
      const files = await desktop.openFileDialog();
      if (files && files.length > 0) {
        alert(`Selected: ${files.join(', ')}`);
      }
    } else {
      alert('File open dialog (desktop mode)');
    }
  };

  const handlePasteLog = async () => {
    if (desktop?.readClipboard) {
      const text = await desktop.readClipboard();
      if (text.trim()) {
        alert(`Pasted ${text.split('\n').length} lines from clipboard!`);
      } else {
        alert('Clipboard is empty.');
      }
    } else {
      try {
        const text = await navigator.clipboard.readText();
        alert(`Pasted ${text.split('\n').length} lines!`);
      } catch {
        alert('Could not access clipboard.');
      }
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-brand">
          <Logo size={24} />
          <span>{t('appName')}</span>
        </div>

        <div className="app-actions">
          <button
            type="button"
            className="button"
            onClick={handleOpenFile}
            title={t('common.openFile')}
          >
            <IconFolderOpen size={16} stroke={1.5} />
            <span>{t('common.openFile')}</span>
          </button>

          <button
            type="button"
            className="button"
            onClick={handlePasteLog}
            title={t('common.pasteLog')}
          >
            <IconClipboard size={16} stroke={1.5} />
            <span>{t('common.pasteLog')}</span>
          </button>

          <button
            type="button"
            className="button icon-only"
            onClick={toggleTheme}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {resolvedTheme(prefs.theme) === 'dark' ? (
              <IconSun size={17} stroke={1.5} />
            ) : (
              <IconMoon size={17} stroke={1.5} />
            )}
          </button>

          <button
            type="button"
            className="button icon-only"
            onClick={() => setSettingsOpen(true)}
            title={t('common.settings')}
            aria-label={t('common.settings')}
          >
            <IconSettings size={17} stroke={1.5} />
          </button>
        </div>
      </header>

      <main className="app-content">
        <div className="hero-box">
          <Logo size={48} />
          <h2>{t('hero.title')}</h2>
          <p>{t('hero.subtitle')}</p>

          <div className="hero-actions">
            <button
              type="button"
              className="button primary"
              onClick={handleOpenFile}
            >
              <IconFolderOpen size={16} stroke={1.5} />
              <span>{t('hero.openButton')}</span>
            </button>

            <button
              type="button"
              className="button"
              onClick={handlePasteLog}
            >
              <IconClipboard size={16} stroke={1.5} />
              <span>{t('hero.pasteButton')}</span>
            </button>
          </div>
        </div>
      </main>

      {settingsOpen && (
        <SettingsDialog onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
