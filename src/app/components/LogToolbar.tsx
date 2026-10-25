import { useRef } from 'react';
import {
  IconArrowDown,
  IconArrowUp,
  IconBorderHorizontal,
  IconCalendar,
  IconChevronDown,
  IconChevronUp,
  IconLetterCase,
  IconRegex,
  IconSearch,
  IconTextWrap,
  IconX,
} from '@tabler/icons-react';
import type { LogLevel, LogStats } from '../../core/types.ts';
import { useTranslation } from '../i18n/index.ts';

interface LogSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isRegex: boolean;
  onToggleRegex: () => void;
  caseSensitive: boolean;
  onToggleCaseSensitive: () => void;
  totalMatches: number;
  currentMatchIndex: number;
  onNextMatch: () => void;
  onPrevMatch: () => void;
  isBottom?: boolean;
}

export function LogSearchBar({
  searchQuery,
  onSearchChange,
  isRegex,
  onToggleRegex,
  caseSensitive,
  onToggleCaseSensitive,
  totalMatches,
  currentMatchIndex,
  onNextMatch,
  onPrevMatch,
  isBottom = false,
}: LogSearchBarProps) {
  const { t } = useTranslation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onSearchChange('');
    searchInputRef.current?.focus();
  };

  return (
    <div className={`log-search-container ${isBottom ? 'is-bottom-search-bar' : ''}`}>
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

      {searchQuery.trim().length > 0 && (
        <span className="search-match-counter">
          {totalMatches > 0
            ? `${currentMatchIndex + 1} / ${totalMatches}`
            : '0 / 0'}
        </span>
      )}

      {totalMatches > 0 && (
        <div className="search-nav-arrows">
          <button
            type="button"
            className="search-nav-arrow-btn"
            onClick={onPrevMatch}
            title={`${t('viewer.prevMatch')} (Shift+Enter)`}
          >
            <IconChevronUp size={14} stroke={1.5} />
          </button>
          <button
            type="button"
            className="search-nav-arrow-btn"
            onClick={onNextMatch}
            title={`${t('viewer.nextMatch')} (Enter)`}
          >
            <IconChevronDown size={14} stroke={1.5} />
          </button>
        </div>
      )}

      <div className="search-tools">
        <button
          type="button"
          className={`search-tool-btn ${caseSensitive ? 'is-active' : ''}`}
          onClick={onToggleCaseSensitive}
          title={t('viewer.caseSensitive')}
        >
          <IconLetterCase size={15} stroke={1.5} />
        </button>

        <button
          type="button"
          className={`search-tool-btn ${isRegex ? 'is-active' : ''}`}
          onClick={onToggleRegex}
          title={t('viewer.useRegex')}
        >
          <IconRegex size={15} stroke={1.5} />
        </button>

        {searchQuery && (
          <button
            type="button"
            className="search-tool-btn"
            onClick={handleClear}
            title={t('viewer.clearSearch')}
          >
            <IconX size={15} stroke={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}

interface LogToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isRegex: boolean;
  onToggleRegex: () => void;
  caseSensitive: boolean;
  onToggleCaseSensitive: () => void;
  totalMatches: number;
  currentMatchIndex: number;
  onNextMatch: () => void;
  onPrevMatch: () => void;
  levelFilter: LogLevel | 'all';
  onLevelFilterChange: (level: LogLevel | 'all') => void;
  stats: LogStats;
  isDateFilterActive: boolean;
  onOpenDateFilter: (anchor: HTMLElement) => void;
  wordWrap: boolean;
  onToggleWordWrap: () => void;
  showLineSeparator: boolean;
  onToggleLineSeparator: () => void;
  onScrollToTop: () => void;
  onScrollToBottom: () => void;
  hideSearchBar?: boolean;
}

export function LogToolbar({
  searchQuery,
  onSearchChange,
  isRegex,
  onToggleRegex,
  caseSensitive,
  onToggleCaseSensitive,
  totalMatches,
  currentMatchIndex,
  onNextMatch,
  onPrevMatch,
  levelFilter,
  onLevelFilterChange,
  stats,
  isDateFilterActive,
  onOpenDateFilter,
  wordWrap,
  onToggleWordWrap,
  showLineSeparator,
  onToggleLineSeparator,
  onScrollToTop,
  onScrollToBottom,
  hideSearchBar = false,
}: LogToolbarProps) {
  const { t } = useTranslation();
  const dateBtnRef = useRef<HTMLButtonElement>(null);
  const errorCount = stats.error + stats.fatal;

  return (
    <div className={`log-toolbar ${hideSearchBar ? 'has-bottom-search' : ''}`}>
      {/* Search Bar in top toolbar if not placed at bottom */}
      {!hideSearchBar && (
        <LogSearchBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          isRegex={isRegex}
          onToggleRegex={onToggleRegex}
          caseSensitive={caseSensitive}
          onToggleCaseSensitive={onToggleCaseSensitive}
          totalMatches={totalMatches}
          currentMatchIndex={currentMatchIndex}
          onNextMatch={onNextMatch}
          onPrevMatch={onPrevMatch}
        />
      )}

      {/* Severity Filter Chips (aligned to start if search is at bottom) */}
      <div className={`log-severity-chips ${hideSearchBar ? 'is-aligned-start' : ''}`}>
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
        {/* Date Filter Button */}
        <button
          ref={dateBtnRef}
          type="button"
          className={`toolbar-btn ${isDateFilterActive ? 'is-active' : ''}`}
          onClick={() => dateBtnRef.current && onOpenDateFilter(dateBtnRef.current)}
          disabled={!stats.hasTimestamps}
          title={
            stats.hasTimestamps
              ? t('viewer.dateFilterTitle')
              : t('viewer.noTimestamps')
          }
        >
          <IconCalendar size={16} stroke={1.5} />
          {isDateFilterActive && <span className="toolbar-indicator-dot" />}
        </button>

        {/* Word Wrap Toggle */}
        <button
          type="button"
          className={`toolbar-btn ${wordWrap ? 'is-active' : ''}`}
          onClick={onToggleWordWrap}
          title={t('viewer.wrapLines')}
        >
          <IconTextWrap size={16} stroke={1.5} />
        </button>

        {/* Line Separator Toggle */}
        <button
          type="button"
          className={`toolbar-btn ${showLineSeparator ? 'is-active' : ''}`}
          onClick={onToggleLineSeparator}
          title={t('viewer.toggleLineSeparator')}
        >
          <IconBorderHorizontal size={16} stroke={1.5} />
        </button>

        {/* Jump to top */}
        <button
          type="button"
          className="toolbar-btn"
          onClick={onScrollToTop}
          title={t('viewer.jumpToTop')}
        >
          <IconArrowUp size={16} stroke={1.5} />
        </button>

        {/* Jump to bottom */}
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
