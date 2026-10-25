import { useMemo, useState } from 'react';
import {
  IconAlertTriangle,
  IconCheck,
  IconCopy,
  IconFileCode,
  IconTerminal2,
  IconX,
} from '@tabler/icons-react';
import {
  detectCurlPattern,
  detectJavaErrorPattern,
} from '../../core/logPatterns.ts';
import type { ParsedLogLine } from '../../core/types.ts';
import { useTranslation } from '../i18n/index.ts';
import { JsonHighlightViewer } from './JsonHighlightViewer.tsx';

interface LogDetailModalProps {
  line: ParsedLogLine;
  allLines?: ParsedLogLine[];
  onClose: () => void;
}

export function LogDetailModal({ line, allLines, onClose }: LogDetailModalProps) {
  const { t } = useTranslation();
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedJava, setCopiedJava] = useState(false);

  // 1. Detect cURL pattern in the line
  const detectedCurl = useMemo(() => {
    return detectCurlPattern(line.raw);
  }, [line.raw]);

  // 2. Detect Java Exception & Stacktrace (lookahead in subsequent lines if available)
  const detectedJava = useMemo(() => {
    let nextLines: string[] | undefined;
    if (allLines && allLines.length > 0) {
      const idx = allLines.findIndex((l) => l.rawIndex === line.rawIndex);
      if (idx !== -1) {
        nextLines = allLines.slice(idx + 1, idx + 45).map((l) => l.raw);
      }
    }
    return detectJavaErrorPattern(line.raw, nextLines);
  }, [line.raw, line.rawIndex, allLines]);

  const handleCopyRaw = async () => {
    try {
      await navigator.clipboard.writeText(line.raw);
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 1500);
    } catch (err) {
      console.error('Failed to copy raw line:', err);
    }
  };

  const handleCopyCurl = async () => {
    if (!detectedCurl) return;
    try {
      await navigator.clipboard.writeText(detectedCurl.command);
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 1500);
    } catch (err) {
      console.error('Failed to copy cURL command:', err);
    }
  };

  const handleCopyJava = async () => {
    if (!detectedJava) return;
    try {
      await navigator.clipboard.writeText(detectedJava.rawBlock);
      setCopiedJava(true);
      setTimeout(() => setCopiedJava(false), 1500);
    } catch (err) {
      console.error('Failed to copy Java stacktrace:', err);
    }
  };

  return (
    /* Scrim does NOT close when clicked outside, per user specification */
    <div className="dialog-scrim" role="dialog" aria-modal="true">
      <div
        className="dialog log-detail-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="dialog-header">
          <div className="dialog-title-group">
            <h3>{t('detail.title', { line: line.lineNumber })}</h3>
            <span className={`log-level-badge log-level-${line.level}`}>
              {line.customLevelTag ? line.customLevelTag.toUpperCase() : line.level.toUpperCase()}
            </span>
          </div>
          <button
            type="button"
            className="dialog-close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <IconX size={18} stroke={1.5} />
          </button>
        </header>

        <div className="dialog-body log-detail-body">
          {/* Metadata Grid */}
          <div className="log-detail-meta">
            {line.timestamp && (
              <div className="detail-meta-item">
                <span className="detail-meta-label">{t('detail.timestamp')}:</span>
                <span className="detail-meta-value">{line.timestamp}</span>
              </div>
            )}
            <div className="detail-meta-item">
              <span className="detail-meta-label">{t('detail.lineNumber')}:</span>
              <span className="detail-meta-value">#{line.lineNumber}</span>
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-label">{t('detail.level')}:</span>
              <span className="detail-meta-value">
                {line.customLevelTag ? line.customLevelTag.toUpperCase() : line.level.toUpperCase()}
              </span>
            </div>
          </div>

          {/* 1. Formatted JSON Blocks (Rendered FIRST if detected) */}
          {line.jsonPayloads && line.jsonPayloads.length > 0 && (
            <div className="log-detail-section">
              <div className="detail-section-header">
                <h4>
                  <IconFileCode size={16} stroke={1.5} />
                  <span>{t('detail.detectedJson')} ({line.jsonPayloads.length})</span>
                </h4>
              </div>

              <div className="detail-json-blocks">
                {line.jsonPayloads.map((rawJson, idx) => (
                  <JsonHighlightViewer key={idx} rawJson={rawJson} index={idx} />
                ))}
              </div>
            </div>
          )}

          {/* 2. Structured cURL Command Block (Rendered BELOW JSON if detected) */}
          {detectedCurl && (
            <div className="log-detail-section">
              <div className="detail-section-header">
                <h4>
                  <IconTerminal2 size={16} stroke={1.5} />
                  <span>{t('detail.detectedCurl')}</span>
                  <span className="detail-tag-method">{detectedCurl.method}</span>
                </h4>
                <button
                  type="button"
                  className="button button-sm button-ghost"
                  onClick={handleCopyCurl}
                >
                  {copiedCurl ? (
                    <>
                      <IconCheck size={14} stroke={1.5} className="copy-success-icon" />
                      <span>{t('common.copied')}</span>
                    </>
                  ) : (
                    <>
                      <IconCopy size={14} stroke={1.5} />
                      <span>{t('detail.copyCurl')}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="detail-curl-card">
                <pre className="detail-curl-code">
                  <code>{detectedCurl.command}</code>
                </pre>
              </div>
            </div>
          )}

          {/* 3. Java Exception & Stacktrace Block (Rendered if detected) */}
          {detectedJava && (
            <div className="log-detail-section">
              <div className="detail-section-header">
                <h4>
                  <IconAlertTriangle size={16} stroke={1.5} style={{ color: 'var(--danger)' }} />
                  <span>{t('detail.detectedJavaError')}</span>
                  <span className="detail-tag-exception">{detectedJava.simpleName}</span>
                </h4>
                <button
                  type="button"
                  className="button button-sm button-ghost"
                  onClick={handleCopyJava}
                >
                  {copiedJava ? (
                    <>
                      <IconCheck size={14} stroke={1.5} className="copy-success-icon" />
                      <span>{t('common.copied')}</span>
                    </>
                  ) : (
                    <>
                      <IconCopy size={14} stroke={1.5} />
                      <span>{t('detail.copyJavaError')}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="detail-java-card">
                <div className="detail-java-header">
                  <div className="detail-java-class">{detectedJava.exceptionClass}</div>
                  {detectedJava.targetUrl && (
                    <div className="detail-java-url">{detectedJava.targetUrl}</div>
                  )}
                </div>

                {detectedJava.message && (
                  <div className="detail-java-message">
                    <strong>{t('detail.javaMessage')}:</strong> {detectedJava.message}
                  </div>
                )}

                {detectedJava.nestedCauses.length > 0 && (
                  <div className="detail-java-causes">
                    <span className="causes-title">{t('detail.javaCauses')}:</span>
                    <ul>
                      {detectedJava.nestedCauses.map((cause, i) => (
                        <li key={i}>{cause}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {detectedJava.stackTrace.length > 0 && (
                  <div className="detail-java-trace">
                    <div className="trace-code-container">
                      {detectedJava.stackTrace.map((frame, i) => (
                        <div key={i} className="trace-line">
                          <span className="trace-line-number">{i + 1}</span>
                          <span className="trace-line-text">{frame}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. Raw Log Message (Rendered AFTER all structured sections) */}
          <div className="log-detail-section">
            <div className="detail-section-header">
              <h4>{t('detail.rawMessage')}</h4>
              <button
                type="button"
                className="button button-sm button-ghost"
                onClick={handleCopyRaw}
              >
                {copiedRaw ? (
                  <>
                    <IconCheck size={14} stroke={1.5} className="copy-success-icon" />
                    <span>{t('common.copied')}</span>
                  </>
                ) : (
                  <>
                    <IconCopy size={14} stroke={1.5} />
                    <span>{t('detail.copyRaw')}</span>
                  </>
                )}
              </button>
            </div>
            <pre className="detail-raw-content">{line.raw}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
