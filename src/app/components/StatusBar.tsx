import {
  IconArrowDownCircle,
  IconFolder,
  IconTextWrap,
} from '@tabler/icons-react';
import { useTranslation } from '../i18n/index.ts';
import { desktop } from '../platform/desktop.ts';
import { formatBytes } from '../platform/fileLoader.ts';

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
}: StatusBarProps) {
  const { t } = useTranslation();
  const isFiltered = filteredLines !== totalLines;

  const handleOpenNativeFolder = async () => {
    if (filePath && desktop?.showItemInFolder) {
      await desktop.showItemInFolder(filePath);
    }
  };

  return (
    <footer className="status-bar" role="status">
      <div className="status-bar-section">
        <span className="status-metric">
          {isFiltered
            ? t('statusBar.filtered', {
                filtered: filteredLines.toLocaleString(),
                total: totalLines.toLocaleString(),
              })
            : t('statusBar.lines', { count: totalLines.toLocaleString() })}
        </span>

        {fileSize !== undefined && (
          <span className="status-metric">
            {formatBytes(fileSize)}
          </span>
        )}

        <span className="status-metric">{encoding}</span>

        {/* Real file path hyperlink button: placed after UTF-8, gray text, with custom pleasant tooltip */}
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
        <button
          type="button"
          className={`status-button ${wordWrap ? 'is-active' : ''}`}
          onClick={onToggleWordWrap}
          title={t('viewer.wrapLines')}
        >
          <IconTextWrap size={14} stroke={1.5} />
          <span>{wordWrap ? t('statusBar.wrapOn') : t('statusBar.wrapOff')}</span>
        </button>

        <button
          type="button"
          className={`status-button ${autoScroll ? 'is-active' : ''}`}
          onClick={onToggleAutoScroll}
          title={t('viewer.autoScroll')}
        >
          <IconArrowDownCircle size={14} stroke={1.5} />
          <span>{autoScroll ? t('statusBar.autoScrollOn') : t('statusBar.autoScrollOff')}</span>
        </button>
      </div>
    </footer>
  );
}
