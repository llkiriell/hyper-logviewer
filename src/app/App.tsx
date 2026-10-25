import { useEffect, useRef, useState } from 'react';
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
  openFileObjects,
  openNativeFileDialog,
  pasteClipboardAsTab,
} from './platform/fileLoader.ts';
import {
  resolvedTheme,
  setPreferences,
  usePreferences,
} from './platform/preferences.ts';
import { getActiveTab, useTabs } from './tabs.ts';
import { DropZone } from './components/DropZone.tsx';
import { Logo } from './components/primitives.tsx';
import { SettingsDialog } from './components/settings/SettingsDialog.tsx';
import { TabBar } from './components/TabBar.tsx';
import { VirtualLogView } from './components/VirtualLogView.tsx';

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
  const { tabs } = useTabs();
  const activeTab = getActiveTab();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useThemeManager();

  // Set desktop attribute on document for native titlebar spacing
  useEffect(() => {
    if (desktop) {
      document.documentElement.dataset.desktop = desktop.platform;
    }
  }, []);

  const handleOpenFile = async () => {
    if (desktop?.openFileDialog) {
      await openNativeFileDialog();
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePasteLog = async () => {
    await pasteClipboardAsTab(t('common.pasteLog'));
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      await openFileObjects(event.target.files);
      event.target.value = '';
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        if (event.key === ',') {
          event.preventDefault();
          setSettingsOpen((prev) => !prev);
        } else if (event.key === 'o' || event.key === 'O') {
          event.preventDefault();
          void handleOpenFile();
        } else if (event.key === 'v' || event.key === 'V') {
          event.preventDefault();
          void handlePasteLog();
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

  return (
    <DropZone>
      <div className="app-container">
        {/* Hidden file input for web fallback and standard file chooser */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".log,.txt,.out,.err,.json,*"
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />

        {/* Top Header / Bar */}
        <header className="app-header">
          <div className="app-brand">
            <Logo size={22} />
            <span>{t('appName')}</span>
          </div>

          <div className="app-actions">
            <button
              type="button"
              className="button"
              onClick={handleOpenFile}
              title={`${t('common.openFile')} (Ctrl+O)`}
            >
              <IconFolderOpen size={16} stroke={1.5} />
              <span>{t('common.openFile')}</span>
            </button>

            <button
              type="button"
              className="button"
              onClick={handlePasteLog}
              title={`${t('common.pasteLog')} (Ctrl+V)`}
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
              title={`${t('common.settings')} (Ctrl+,)`}
              aria-label={t('common.settings')}
            >
              <IconSettings size={17} stroke={1.5} />
            </button>
          </div>
        </header>

        {/* Tabs Bar (displayed when tabs exist) */}
        {tabs.length > 0 && <TabBar onNewTabClick={handleOpenFile} />}

        {/* Main Content Area */}
        {activeTab ? (
          <VirtualLogView tab={activeTab} />
        ) : (
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
        )}

        {/* Settings Dialog */}
        {settingsOpen && (
          <SettingsDialog onClose={() => setSettingsOpen(false)} />
        )}
      </div>
    </DropZone>
  );
}
