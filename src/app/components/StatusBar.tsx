import { useEffect, useRef, useState } from 'react';
import {
  IconArrowDownCircle,
  IconFolder,
  IconMoon,
  IconSettings,
  IconSun,
  IconTextWrap,
  IconX,
} from '@tabler/icons-react';
import { useTranslation } from '../i18n/index.ts';
import { desktop } from '../platform/desktop.ts';
import { formatBytes } from '../platform/fileLoader.ts';
import {
  resolvedTheme,
  setPreferences,
  usePreferences,
} from '../platform/preferences.ts';

interface StatusBarProps {
  totalLines: number;
  filteredLines: number;
  fileSize?: number;
  filePath?: string;
  encoding?: string;
  wordWrap: boolean;
  onToggleWordWrap: () => void;
  autoScroll: boolean;
  onToggleAutoScroll: () => void;
  onGoToLine?: (lineNum: number) => void;
  onOpenSettings?: () => void;
}

export function StatusBar({
  totalLines,
  filteredLines,
  fileSize,
  filePath,
  encoding = 'UTF-8',
  wordWrap,
  onToggleWordWrap,
  autoScroll,
  onToggleAutoScroll,
  onGoToLine,
  onOpenSettings,
}: StatusBarProps) {
  const { t } = useTranslation();
  const prefs = usePreferences();
  const [goToOpen, setGoToOpen] = useState(false);
  const [goToLineInput, setGoToLineInput] = useState('');
  const goToInputRef = useRef<HTMLInputElement>(null);
  const isFiltered = filteredLines !== totalLines;

  // Handle go to line submission
  const handleGoToSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(goToLineInput, 10);
    if (!isNaN(num) && num >= 1 && num <= totalLines && onGoToLine) {
      onGoToLine(num);
      setGoToOpen(false);
      setGoToLineInput('');
    }
  };

  useEffect(() => {
    if (goToOpen) {
      goToInputRef.current?.focus();
    }
  }, [goToOpen]);

  // Global Ctrl+G shortcut to toggle go to line popover
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        setGoToOpen((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenNativeFolder = async () => {
    if (filePath && desktop?.showItemInFolder) {
      await desktop.showItemInFolder(filePath);
    }
  };

  const toggleTheme = () => {
    const next = resolvedTheme(prefs.theme) === 'dark' ? 'light' : 'dark';
    setPreferences({ theme: next });
  };

  return (
    <footer className="status-bar" role="status">
      <div className="status-bar-section">
        {/* Clickable Line Counter with Go to Line Popover */}
        <div className="status-goto-wrapper">
          <button
            type="button"
            className="status-metric status-metric-btn"
            onClick={() => setGoToOpen((prev) => !prev)}
            title={`${t('viewer.goToLine')} (Ctrl+G)`}
          >
            {isFiltered
              ? t('statusBar.filtered', {
                  filtered: filteredLines.toLocaleString(),
                  total: totalLines.toLocaleString(),
                })
              : t('statusBar.lines', { count: totalLines.toLocaleString() })}
          </button>

          {goToOpen && onGoToLine && (
            <form onSubmit={handleGoToSubmit} className="status-goto-popover">
              <span className="goto-label">{t('viewer.goToLinePrompt')}</span>
              <div className="goto-input-row">
                <input
                  ref={goToInputRef}
                  type="number"
                  min={1}
                  max={totalLines}
                  value={goToLineInput}
                  onChange={(e) => setGoToLineInput(e.target.value)}
                  placeholder={`1-${totalLines}`}
                  className="goto-input"
                />
                <button type="submit" className="button button-xs primary">
                  {t('viewer.go')}
                </button>
                <button
                  type="button"
                  className="button button-xs button-ghost"
                  onClick={() => setGoToOpen(false)}
                >
                  <IconX size={12} stroke={1.5} />
                </button>
              </div>
            </form>
          )}
        </div>

        {fileSize !== undefined && (
          <span className="status-metric">
            {formatBytes(fileSize)}
          </span>
        )}

        <span className="status-metric">{encoding}</span>

        {/* Truncated File Path Hyperlink with Pleasant Tooltip */}
        {filePath && (
          <div className="status-filepath-wrapper">
            <button
              type="button"
              className="status-filepath-btn"
              onClick={handleOpenNativeFolder}
              aria-label={t('statusBar.showInFolder')}
            >
              <IconFolder size={13} stroke={1.5} />
              <span className="status-filepath-text">{filePath}</span>
            </button>
            <div className="status-filepath-tooltip" role="tooltip">
              <span className="tooltip-title">{t('statusBar.showInFolder')}</span>
              <span className="tooltip-path">{filePath}</span>
            </div>
          </div>
        )}
      </div>

      <div className="status-bar-section status-actions">
        {/* Word Wrap Toggle */}
        <button
          type="button"
          className={`status-button ${wordWrap ? 'is-active' : ''}`}
          onClick={onToggleWordWrap}
          title={t('viewer.wrapLines')}
        >
          <IconTextWrap size={14} stroke={1.5} />
          <span>{wordWrap ? t('statusBar.wrapOn') : t('statusBar.wrapOff')}</span>
        </button>

        {/* Auto Scroll Toggle */}
        <button
          type="button"
          className={`status-button ${autoScroll ? 'is-active' : ''}`}
          onClick={onToggleAutoScroll}
          title={t('viewer.autoScroll')}
        >
          <IconArrowDownCircle size={14} stroke={1.5} />
          <span>{autoScroll ? t('statusBar.autoScrollOn') : t('statusBar.autoScrollOff')}</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          className="status-button icon-only"
          onClick={toggleTheme}
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {resolvedTheme(prefs.theme) === 'dark' ? (
            <IconSun size={14} stroke={1.5} />
          ) : (
            <IconMoon size={14} stroke={1.5} />
          )}
        </button>

        {/* Settings Gear Button (far right) */}
        {onOpenSettings && (
          <button
            type="button"
            className="status-button icon-only"
            onClick={onOpenSettings}
            title={`${t('common.settings')} (Ctrl+,)`}
            aria-label={t('common.settings')}
          >
            <IconSettings size={14} stroke={1.5} />
          </button>
        )}
      </div>
    </footer>
  );
}
