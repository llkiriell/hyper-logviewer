import { memo, useMemo, useState } from 'react';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { findMatchRanges, splitTextWithMatches } from '../../core/search.ts';
import type { ParsedLogLine } from '../../core/types.ts';
import { useTranslation } from '../i18n/index.ts';

interface VirtualLogRowProps {
  line: ParsedLogLine;
  searchQuery: string;
  isRegex: boolean;
  caseSensitive: boolean;
  wordWrap: boolean;
  fontSize: number;
}

export const VirtualLogRow = memo(function VirtualLogRow({
  line,
  searchQuery,
  isRegex,
  caseSensitive,
  wordWrap,
  fontSize,
}: VirtualLogRowProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const matchRanges = useMemo(() => {
    if (!searchQuery) return [];
    return findMatchRanges(line.raw, searchQuery, isRegex, caseSensitive);
  }, [line.raw, searchQuery, isRegex, caseSensitive]);

  const parts = useMemo(() => {
    return splitTextWithMatches(line.raw, matchRanges);
  }, [line.raw, matchRanges]);

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

  return (
    <div
      className={`log-row log-row-${line.level} ${wordWrap ? 'is-wrapped' : ''}`}
      style={{ fontSize: `${fontSize}px` }}
    >
      {/* Line Number Gutter */}
      <span className="log-gutter" title={`Line ${line.lineNumber}`}>
        {line.lineNumber}
      </span>

      {/* Log Level Indicator */}
      <span className={`log-level-badge log-level-${line.level}`}>
        {line.level.toUpperCase()}
      </span>

      {/* Log Line Text Content */}
      <div className="log-content">
        {parts.map((part, idx) =>
          part.isMatch ? (
            <mark key={idx} className="log-match">
              {part.text}
            </mark>
          ) : (
            <span key={idx}>{part.text}</span>
          ),
        )}
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
