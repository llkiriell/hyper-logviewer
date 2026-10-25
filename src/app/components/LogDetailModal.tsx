import { useState } from 'react';
import {
  IconCheck,
  IconCopy,
  IconFileCode,
  IconX,
} from '@tabler/icons-react';
import type { ParsedLogLine } from '../../core/types.ts';
import { useTranslation } from '../i18n/index.ts';
import { JsonHighlightViewer } from './JsonHighlightViewer.tsx';

interface LogDetailModalProps {
  line: ParsedLogLine;
  onClose: () => void;
}

export function LogDetailModal({ line, onClose }: LogDetailModalProps) {
  const { t } = useTranslation();
  const [copiedRaw, setCopiedRaw] = useState(false);

  const handleCopyRaw = async () => {
    try {
      await navigator.clipboard.writeText(line.raw);
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 1500);
    } catch (err) {
      console.error('Failed to copy raw line:', err);
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

          {/* Formatted JSON Blocks (Rendered FIRST if detected) */}
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

          {/* Raw Log Message (Rendered AFTER JSON) */}
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
