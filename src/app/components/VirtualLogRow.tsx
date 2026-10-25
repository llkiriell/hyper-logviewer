import { memo, useMemo, useState } from 'react';
import {
  IconCheck,
  IconCopy,
  IconPin,
  IconPinFilled,
} from '@tabler/icons-react';
import {
  findMatchRanges,
  splitTextWithSearchAndHighlights,
} from '../../core/search.ts';
import type {
  CustomHighlightRule,
  LevelColorConfig,
  ParsedLogLine,
  SearchMatchRange,
} from '../../core/types.ts';
import { useTranslation } from '../i18n/index.ts';

interface VirtualLogRowProps {
  line: ParsedLogLine;
  searchQuery: string;
  isRegex: boolean;
  caseSensitive: boolean;
  activeSearchRange?: SearchMatchRange | null;
  customRules?: CustomHighlightRule[];
  levelColor?: LevelColorConfig;
  showSeparator?: boolean;
  separatorColor?: string;
  wordWrap: boolean;
  fontSize: number;
  isPinned: boolean;
  onTogglePin: (line: ParsedLogLine) => void;
  onContextMenu: (event: React.MouseEvent, line: ParsedLogLine) => void;
}

export const VirtualLogRow = memo(function VirtualLogRow({
  line,
  searchQuery,
  isRegex,
  caseSensitive,
  activeSearchRange,
  customRules,
  levelColor,
  showSeparator = false,
  separatorColor = '#e5e5e3',
  wordWrap,
  fontSize,
  isPinned,
  onTogglePin,
  onContextMenu,
}: VirtualLogRowProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const searchRanges = useMemo(() => {
    if (!searchQuery) return [];
    return findMatchRanges(line.raw, searchQuery, isRegex, caseSensitive);
  }, [line.raw, searchQuery, isRegex, caseSensitive]);

  const chunks = useMemo(() => {
    return splitTextWithSearchAndHighlights(
      line.raw,
      searchRanges,
      activeSearchRange,
      customRules,
    );
  }, [line.raw, searchRanges, activeSearchRange, customRules]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(line.raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy line:', err);
    }
  };

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePin(line);
  };

  // Safe background color from level configuration
  const rowBg =
    levelColor && levelColor.bgColor !== 'transparent'
      ? levelColor.bgColor
      : undefined;

  const rowBorderBottom = showSeparator
    ? `1px solid ${separatorColor}`
    : undefined;

  return (
    <div
      className={`log-row log-row-${line.level} ${wordWrap ? 'is-wrapped' : ''} ${isPinned ? 'is-pinned-row' : ''}`}
      style={{
        fontSize: `${fontSize}px`,
        backgroundColor: rowBg,
        borderBottom: rowBorderBottom,
      }}
      onContextMenu={(e) => onContextMenu(e, line)}
    >
      {/* Pin Button */}
      <button
        type="button"
        className={`log-pin-btn ${isPinned ? 'is-active' : ''}`}
        onClick={handlePinClick}
        title={isPinned ? t('viewer.unpinLine') : t('viewer.pinLine')}
      >
        {isPinned ? (
          <IconPinFilled size={13} stroke={1.5} />
        ) : (
          <IconPin size={13} stroke={1.5} />
        )}
      </button>

      {/* Line Number Gutter */}
      <span className="log-gutter" title={`Line ${line.lineNumber}`}>
        {line.lineNumber}
      </span>

      {/* Log Level Indicator */}
      <span
        className={`log-level-badge log-level-${line.level}`}
        style={levelColor ? { color: levelColor.textColor } : undefined}
      >
        {line.level.toUpperCase()}
      </span>

      {/* Log Line Text Content */}
      <div className="log-content">
        {chunks.map((chunk, idx) => {
          if (chunk.isSearchMatch) {
            return (
              <mark
                key={idx}
                className={`log-match ${chunk.isActiveMatch ? 'is-active-match' : ''}`}
              >
                {chunk.text}
              </mark>
            );
          }

          if (chunk.customStyle) {
            return (
              <span
                key={idx}
                style={{
                  color: chunk.customStyle.color,
                  fontWeight: chunk.customStyle.bold ? 700 : undefined,
                  fontStyle: chunk.customStyle.italic ? 'italic' : undefined,
                }}
              >
                {chunk.text}
              </span>
            );
          }

          return <span key={idx}>{chunk.text}</span>;
        })}
      </div>

      {/* Hover Copy Button */}
      <button
        type="button"
        className="log-copy-btn"
        onClick={handleCopy}
        title={t('viewer.copyLine')}
      >
        {copied ? (
          <IconCheck size={13} stroke={1.5} className="copy-success-icon" />
        ) : (
          <IconCopy size={13} stroke={1.5} />
        )}
      </button>
    </div>
  );
});
