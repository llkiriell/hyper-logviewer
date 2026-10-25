import { memo, useMemo, useState } from 'react';
import {
  IconCheck,
  IconCopy,
  IconEye,
  IconPin,
  IconPinFilled,
} from '@tabler/icons-react';
import { analyzeBrackets, type BracketInfo } from '../../core/brackets.ts';
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
  isContextMenuTarget?: boolean;
  isHighlighted?: boolean;
  isSelected?: boolean;
  rainbowBrackets?: boolean;
  onTogglePin: (line: ParsedLogLine) => void;
  onContextMenu: (event: React.MouseEvent, line: ParsedLogLine) => void;
  onInspectLine?: (line: ParsedLogLine) => void;
  onSelectLine?: (line: ParsedLogLine) => void;
}

function renderContentWithBrackets(
  text: string,
  startOffset: number,
  bracketMap: Map<number, BracketInfo> | null,
  hoveredBracketPairId: number | null,
  onHoverBracket: (id: number | null) => void,
) {
  if (!bracketMap || bracketMap.size === 0) {
    return text;
  }

  const elements: React.ReactNode[] = [];
  let buffer = '';

  for (let i = 0; i < text.length; i++) {
    const globalIdx = startOffset + i;
    const bracket = bracketMap.get(globalIdx);

    if (bracket) {
      if (buffer) {
        elements.push(buffer);
        buffer = '';
      }
      const isMatched = hoveredBracketPairId === bracket.pairId;
      elements.push(
        <span
          key={`br-${globalIdx}`}
          className={`rainbow-bracket bracket-depth-${bracket.depth % 5} ${isMatched ? 'is-matched-bracket' : ''}`}
          onMouseEnter={(e) => {
            e.stopPropagation();
            onHoverBracket(bracket.pairId);
          }}
          onMouseLeave={(e) => {
            e.stopPropagation();
            onHoverBracket(null);
          }}
          onClick={(e) => {
            e.stopPropagation();
            onHoverBracket(isMatched ? null : bracket.pairId);
          }}
        >
          {bracket.char}
        </span>,
      );
    } else {
      buffer += text[i];
    }
  }

  if (buffer) {
    elements.push(buffer);
  }

  return elements;
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
  isContextMenuTarget = false,
  isHighlighted = false,
  isSelected = false,
  rainbowBrackets = true,
  onTogglePin,
  onContextMenu,
  onInspectLine,
  onSelectLine,
}: VirtualLogRowProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [hoveredBracketPairId, setHoveredBracketPairId] = useState<number | null>(null);

  const bracketMap = useMemo(() => {
    if (!rainbowBrackets) return null;
    return analyzeBrackets(line.raw);
  }, [line.raw, rainbowBrackets]);

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

  // Fully opaque solid composite background for sticky columns (prevents any bleed-through on horizontal scroll)
  const stickySolidStyle = useMemo(() => {
    if (rowBg) {
      return {
        backgroundColor: 'var(--bg)',
        backgroundImage: `linear-gradient(${rowBg}, ${rowBg})`,
      };
    }
    return {
      backgroundColor: 'var(--bg)',
    };
  }, [rowBg]);

  const rowBorderBottom = showSeparator
    ? `1px solid ${separatorColor}`
    : undefined;

  const badgeText = line.customLevelTag
    ? line.customLevelTag.toUpperCase()
    : line.level.toUpperCase();

  return (
    <div
      className={`log-row log-row-${line.level} ${wordWrap ? 'is-wrapped' : ''} ${isPinned ? 'is-pinned-row' : ''} ${isContextMenuTarget ? 'is-context-target' : ''} ${isHighlighted ? 'is-highlighted-focus' : ''} ${isSelected ? 'is-selected-line' : ''}`}
      style={{
        fontSize: `${fontSize}px`,
        backgroundColor: rowBg,
        borderBottom: rowBorderBottom,
      }}
      onClick={() => onSelectLine?.(line)}
      onContextMenu={(e) => onContextMenu(e, line)}
    >
      {/* Sticky Pin Button (Always 100% solid background) */}
      <button
        type="button"
        className={`log-pin-btn ${isPinned ? 'is-active' : ''}`}
        style={stickySolidStyle}
        onClick={handlePinClick}
        title={isPinned ? t('viewer.unpinLine') : t('viewer.pinLine')}
      >
        {isPinned ? (
          <IconPinFilled size={13} stroke={1.5} />
        ) : (
          <IconPin size={13} stroke={1.5} />
        )}
      </button>

      {/* Sticky Line Number Gutter (Always 100% solid background) */}
      <span
        className="log-gutter"
        style={stickySolidStyle}
        title={`Line ${line.lineNumber}`}
      >
        {line.lineNumber}
      </span>

      {/* Sticky Log Level Indicator (Always 100% solid background) */}
      <span
        className={`log-level-badge log-level-${line.level}`}
        style={{
          color: levelColor ? levelColor.textColor : undefined,
          ...stickySolidStyle,
        }}
      >
        {badgeText}
      </span>

      {/* Log Line Text Content */}
      <div className="log-content">
        {chunks.map((chunk, idx) => {
          const renderedText = renderContentWithBrackets(
            chunk.text,
            chunk.startIndex,
            bracketMap,
            hoveredBracketPairId,
            setHoveredBracketPairId,
          );

          if (chunk.isSearchMatch) {
            return (
              <mark
                key={idx}
                className={`log-match ${chunk.isActiveMatch ? 'is-active-match' : ''}`}
              >
                {renderedText}
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
                {renderedText}
              </span>
            );
          }

          return <span key={idx}>{renderedText}</span>;
        })}
      </div>

      {/* Sticky Right-aligned Hover Actions (Zero layout shift on text) */}
      <div className="log-row-actions">
        <button
          type="button"
          className="log-action-btn"
          onClick={handleCopy}
          title={t('viewer.copyLine')}
        >
          {copied ? (
            <IconCheck size={13} stroke={1.5} className="copy-success-icon" />
          ) : (
            <IconCopy size={13} stroke={1.5} />
          )}
        </button>

        {onInspectLine && (
          <button
            type="button"
            className="log-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onInspectLine(line);
            }}
            title={t('contextMenu.inspectLine')}
          >
            <IconEye size={13} stroke={1.5} />
          </button>
        )}
      </div>
    </div>
  );
});
