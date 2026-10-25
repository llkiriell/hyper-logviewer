import {
  IconArrowDownCircle,
  IconTextWrap,
} from '@tabler/icons-react';
import { useTranslation } from '../i18n/index.ts';
import { formatBytes } from '../platform/fileLoader.ts';

interface StatusBarProps {
  totalLines: number;
  filteredLines: number;
  fileSize?: number;
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
  encoding = 'UTF-8',
  wordWrap,
  onToggleWordWrap,
  autoScroll,
  onToggleAutoScroll,
}: StatusBarProps) {
  const { t } = useTranslation();
  const isFiltered = filteredLines !== totalLines;

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
