import { useRef } from 'react';
import {
  IconArrowDown,
  IconArrowDownCircle,
  IconArrowUp,
  IconLetterCase,
  IconRegex,
  IconSearch,
  IconTextWrap,
  IconX,
} from '@tabler/icons-react';
import type { LogLevel, LogStats } from '../../core/types.ts';
import { useTranslation } from '../i18n/index.ts';

interface LogToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isRegex: boolean;
  onToggleRegex: () => void;
  caseSensitive: boolean;
  onToggleCaseSensitive: () => void;
  levelFilter: LogLevel | 'all';
  onLevelFilterChange: (level: LogLevel | 'all') => void;
  stats: LogStats;
  wordWrap: boolean;
  onToggleWordWrap: () => void;
  autoScroll: boolean;
  onToggleAutoScroll: () => void;
  onScrollToTop: () => void;
  onScrollToBottom: () => void;
}

export function LogToolbar({
  searchQuery,
  onSearchChange,
  isRegex,
  onToggleRegex,
  caseSensitive,
  onToggleCaseSensitive,
  levelFilter,
  onLevelFilterChange,
  stats,
  wordWrap,
  onToggleWordWrap,
  autoScroll,
  onToggleAutoScroll,
  onScrollToTop,
  onScrollToBottom,
}: LogToolbarProps) {
  const { t } = useTranslation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const errorCount = stats.error + stats.fatal;

  const handleClear = () => {
    onSearchChange('');
    searchInputRef.current?.focus();
  };

  return (
    <div className="log-toolbar">
      {/* Search Bar with toggles */}
      <div className="log-search-container">
        <IconSearch size={16} stroke={1.5} className="log-search-icon" />
        <input
          ref={searchInputRef}
          type="text"
          className="log-search-input"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('viewer.searchPlaceholder')}
          spellCheck={false}
        />

        {searchQuery.length > 0 && (
          <button
            type="button"
            className="search-tool-btn"
            onClick={handleClear}
            title={t('viewer.clearSearch')}
          >
            <IconX size={14} stroke={1.5} />
          </button>
        )}

        <button
          type="button"
          className={`search-tool-btn ${caseSensitive ? 'is-active' : ''}`}
          onClick={onToggleCaseSensitive}
          title={t('viewer.caseSensitive')}
        >
          <IconLetterCase size={16} stroke={1.5} />
        </button>

        <button
          type="button"
          className={`search-tool-btn ${isRegex ? 'is-active' : ''}`}
          onClick={onToggleRegex}
          title={t('viewer.useRegex')}
        >
          <IconRegex size={16} stroke={1.5} />
        </button>
      </div>

      {/* Severity Filter Chips */}
      <div className="log-severity-chips">
        <button
          type="button"
          className={`chip chip-all ${levelFilter === 'all' ? 'is-selected' : ''}`}
          onClick={() => onLevelFilterChange('all')}
        >
          <span>{t('viewer.filterAll')}</span>
          <span className="chip-count">{stats.total}</span>
        </button>

        {errorCount > 0 && (
          <button
            type="button"
            className={`chip chip-error ${levelFilter === 'error' ? 'is-selected' : ''}`}
            onClick={() => onLevelFilterChange(levelFilter === 'error' ? 'all' : 'error')}
          >
            <span className="chip-dot chip-dot-error" />
            <span>{t('viewer.filterError')}</span>
            <span className="chip-count">{errorCount}</span>
          </button>
        )}

        {stats.warn > 0 && (
          <button
            type="button"
            className={`chip chip-warn ${levelFilter === 'warn' ? 'is-selected' : ''}`}
            onClick={() => onLevelFilterChange(levelFilter === 'warn' ? 'all' : 'warn')}
          >
            <span className="chip-dot chip-dot-warn" />
            <span>{t('viewer.filterWarn')}</span>
            <span className="chip-count">{stats.warn}</span>
          </button>
        )}

        {stats.info > 0 && (
          <button
            type="button"
            className={`chip chip-info ${levelFilter === 'info' ? 'is-selected' : ''}`}
            onClick={() => onLevelFilterChange(levelFilter === 'info' ? 'all' : 'info')}
          >
            <span className="chip-dot chip-dot-info" />
            <span>{t('viewer.filterInfo')}</span>
            <span className="chip-count">{stats.info}</span>
          </button>
        )}

        {stats.debug > 0 && (
          <button
            type="button"
            className={`chip chip-debug ${levelFilter === 'debug' ? 'is-selected' : ''}`}
            onClick={() => onLevelFilterChange(levelFilter === 'debug' ? 'all' : 'debug')}
          >
            <span className="chip-dot chip-dot-debug" />
            <span>{t('viewer.filterDebug')}</span>
            <span className="chip-count">{stats.debug}</span>
          </button>
        )}

        {stats.trace > 0 && (
          <button
            type="button"
            className={`chip chip-trace ${levelFilter === 'trace' ? 'is-selected' : ''}`}
            onClick={() => onLevelFilterChange(levelFilter === 'trace' ? 'all' : 'trace')}
          >
            <span className="chip-dot chip-dot-trace" />
            <span>{t('viewer.filterTrace')}</span>
            <span className="chip-count">{stats.trace}</span>
          </button>
        )}
      </div>

      {/* Quick Navigation & View Toggles */}
      <div className="log-toolbar-actions">
        <button
          type="button"
          className={`toolbar-btn ${wordWrap ? 'is-active' : ''}`}
          onClick={onToggleWordWrap}
          title={t('viewer.wrapLines')}
        >
          <IconTextWrap size={16} stroke={1.5} />
        </button>

        <button
          type="button"
          className={`toolbar-btn ${autoScroll ? 'is-active' : ''}`}
          onClick={onToggleAutoScroll}
          title={t('viewer.autoScroll')}
        >
          <IconArrowDownCircle size={16} stroke={1.5} />
        </button>

        <button
          type="button"
          className="toolbar-btn"
          onClick={onScrollToTop}
          title={t('viewer.jumpToTop')}
        >
          <IconArrowUp size={16} stroke={1.5} />
        </button>

        <button
          type="button"
          className="toolbar-btn"
          onClick={onScrollToBottom}
          title={t('viewer.jumpToBottom')}
        >
          <IconArrowDown size={16} stroke={1.5} />
        </button>
      </div>
    </div>
  );
}
