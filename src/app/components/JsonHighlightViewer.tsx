import { memo, useMemo, useState } from 'react';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { analyzeJsonBrackets, type BracketInfo } from '../../core/brackets.ts';
import { useTranslation } from '../i18n/index.ts';
import { usePreferences } from '../platform/preferences.ts';

interface JsonHighlightViewerProps {
  rawJson: string;
  index: number;
}

// Renders non-token text segments while colorizing structural brackets if rainbow brackets are enabled
function renderJsonSegmentWithBrackets(
  text: string,
  startGlobalOffset: number,
  bracketMap: Map<number, BracketInfo> | null,
  hoveredPairId: number | null,
  onHoverPair: (id: number | null) => void,
): React.ReactNode {
  if (!bracketMap || bracketMap.size === 0) {
    return text;
  }

  const nodes: React.ReactNode[] = [];
  let buffer = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const globalIdx = startGlobalOffset + i;
    const bracket = bracketMap.get(globalIdx);

    if (bracket) {
      if (buffer) {
        nodes.push(buffer);
        buffer = '';
      }
      const isMatched = hoveredPairId === bracket.pairId;
      nodes.push(
        <span
          key={`br-${globalIdx}`}
          className={`rainbow-bracket bracket-depth-${bracket.depth % 5} ${isMatched ? 'is-matched-bracket' : ''}`}
          onMouseEnter={(e) => {
            e.stopPropagation();
            onHoverPair(bracket.pairId);
          }}
          onMouseLeave={(e) => {
            e.stopPropagation();
            onHoverPair(null);
          }}
        >
          {char}
        </span>,
      );
    } else {
      buffer += char;
    }
  }

  if (buffer) {
    nodes.push(buffer);
  }

  return nodes.length > 0 ? nodes : text;
}

// Tokenizes a single line of formatted JSON with rainbow brackets support
function highlightJsonLine(
  line: string,
  lineGlobalOffset: number,
  bracketMap: Map<number, BracketInfo> | null,
  hoveredPairId: number | null,
  onHoverPair: (id: number | null) => void,
) {
  const regex =
    /("(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;

  let lastIndex = 0;
  const nodes: React.ReactNode[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    const textBefore = line.slice(lastIndex, match.index);
    if (textBefore) {
      nodes.push(
        <span key={`text-${lastIndex}`}>
          {renderJsonSegmentWithBrackets(
            textBefore,
            lineGlobalOffset + lastIndex,
            bracketMap,
            hoveredPairId,
            onHoverPair,
          )}
        </span>,
      );
    }

    const token = match[0];
    const isKey = match[2] !== undefined;

    if (isKey) {
      nodes.push(
        <span key={`key-${match.index}`} className="json-token-key">
          {token}
        </span>,
      );
    } else if (token.startsWith('"')) {
      nodes.push(
        <span key={`str-${match.index}`} className="json-token-string">
          {token}
        </span>,
      );
    } else if (token === 'true' || token === 'false') {
      nodes.push(
        <span key={`bool-${match.index}`} className="json-token-boolean">
          {token}
        </span>,
      );
    } else if (token === 'null') {
      nodes.push(
        <span key={`null-${match.index}`} className="json-token-null">
          {token}
        </span>,
      );
    } else {
      nodes.push(
        <span key={`num-${match.index}`} className="json-token-number">
          {token}
        </span>,
      );
    }

    lastIndex = regex.lastIndex;
  }

  const trailing = line.slice(lastIndex);
  if (trailing) {
    nodes.push(
      <span key={`tail-${lastIndex}`}>
        {renderJsonSegmentWithBrackets(
          trailing,
          lineGlobalOffset + lastIndex,
          bracketMap,
          hoveredPairId,
          onHoverPair,
        )}
      </span>,
    );
  }

  return nodes.length > 0 ? nodes : line;
}

export const JsonHighlightViewer = memo(function JsonHighlightViewer({
  rawJson,
  index,
}: JsonHighlightViewerProps) {
  const { t } = useTranslation();
  const prefs = usePreferences();
  const [copied, setCopied] = useState(false);
  const [hoveredBracketPairId, setHoveredBracketPairId] = useState<number | null>(null);

  const formattedJson = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(rawJson), null, 2);
    } catch {
      return rawJson;
    }
  }, [rawJson]);

  const lines = useMemo(() => {
    return formattedJson.split('\n');
  }, [formattedJson]);

  // Compute global character offsets for each line in the formatted string
  const lineOffsets = useMemo(() => {
    const offsets: number[] = [0];
    let curr = 0;
    for (let i = 0; i < lines.length - 1; i++) {
      curr += (lines[i]?.length ?? 0) + 1; // +1 for \n
      offsets.push(curr);
    }
    return offsets;
  }, [lines]);

  // Analyze all structural JSON brackets (ignoring string literals) if rainbow brackets is enabled
  const bracketMap = useMemo(() => {
    if (!prefs.rainbowBrackets) return null;
    return analyzeJsonBrackets(formattedJson);
  }, [formattedJson, prefs.rainbowBrackets]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy JSON:', err);
    }
  };

  const themeClass =
    prefs.jsonTheme === 'insomnia' ? 'json-theme-insomnia' : 'json-theme-postman';

  return (
    <div className={`json-viewer-card ${themeClass}`}>
      <div className="json-viewer-header">
        <div className="json-viewer-meta">
          <span className="json-viewer-tag">JSON #{index + 1}</span>
          <span className="json-viewer-theme-label">
            {prefs.jsonTheme === 'insomnia' ? 'Insomnia' : 'Postman'}
          </span>
        </div>
        <button
          type="button"
          className="button button-xs button-ghost"
          onClick={handleCopy}
          title={t('detail.copyJson')}
        >
          {copied ? (
            <>
              <IconCheck size={13} stroke={1.5} className="copy-success-icon" />
              <span>{t('common.copied')}</span>
            </>
          ) : (
            <>
              <IconCopy size={13} stroke={1.5} />
              <span>{t('detail.copyJson')}</span>
            </>
          )}
        </button>
      </div>

      {/* Unified Single Scroll Container: fixes double scrollbar issue */}
      <div className="json-code-container">
        {lines.map((lineStr, idx) => (
          <div key={idx} className="json-code-line">
            <span className="json-line-number" aria-hidden="true">
              {idx + 1}
            </span>
            <span className="json-line-content">
              {highlightJsonLine(
                lineStr,
                lineOffsets[idx] ?? 0,
                bracketMap,
                hoveredBracketPairId,
                setHoveredBracketPairId,
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
