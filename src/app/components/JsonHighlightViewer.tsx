import { memo, useMemo, useState } from 'react';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { useTranslation } from '../i18n/index.ts';

interface JsonHighlightViewerProps {
  rawJson: string;
  index: number;
}

// Tokenizes a single line of formatted JSON
function highlightJsonLine(line: string) {
  // Regex matches:
  // 1: Keys: "key":
  // 2: String values: "string"
  // 3: Numbers: \b-?\d+(\.\d+)?([eE][+-]?\d+)?\b
  // 4: Booleans: \b(true|false)\b
  // 5: Null: \bnull\b
  const regex = /("(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;

  let lastIndex = 0;
  const nodes: React.ReactNode[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    const textBefore = line.slice(lastIndex, match.index);
    if (textBefore) {
      nodes.push(<span key={`text-${lastIndex}`}>{textBefore}</span>);
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
    nodes.push(<span key={`tail-${lastIndex}`}>{trailing}</span>);
  }

  return nodes.length > 0 ? nodes : line;
}

export const JsonHighlightViewer = memo(function JsonHighlightViewer({
  rawJson,
  index,
}: JsonHighlightViewerProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy JSON:', err);
    }
  };

  return (
    <div className="json-viewer-card">
      <div className="json-viewer-header">
        <span className="json-viewer-tag">JSON #{index + 1}</span>
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

      <div className="json-code-container">
        <div className="json-gutter-column" aria-hidden="true">
          {lines.map((_, idx) => (
            <span key={idx} className="json-line-number">
              {idx + 1}
            </span>
          ))}
        </div>
        <div className="json-lines-column">
          {lines.map((lineStr, idx) => (
            <div key={idx} className="json-code-line">
              {highlightJsonLine(lineStr)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
