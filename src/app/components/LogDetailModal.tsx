import { useMemo, useState } from 'react';
import {
  IconAlertTriangle,
  IconCheck,
  IconCopy,
  IconFileCode,
  IconGitBranch,
  IconTerminal2,
  IconX,
} from '@tabler/icons-react';
import {
  detectCurlPattern,
  detectGitPipeline,
  detectJavaErrorPattern,
  extractLogEntities,
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
  const [copiedGitEntity, setCopiedGitEntity] = useState<string | null>(null);

  // 1. Gather all consecutive continuation lines belonging to this primary entry
  const fullRawMessage = useMemo(() => {
    if (!allLines || allLines.length === 0) return line.raw;
    const idx = allLines.findIndex((l) => l.rawIndex === line.rawIndex);
    if (idx === -1) return line.raw;
    const linesBlock = [line.raw];
    for (let i = idx + 1; i < allLines.length; i++) {
      const next = allLines[i];
      if (next && next.isContinuation) {
        linesBlock.push(next.raw);
      } else {
        break;
      }
    }
    return linesBlock.join('\n');
  }, [line, allLines]);

  // 2. Detect cURL pattern in the line
  const detectedCurl = useMemo(() => {
    return detectCurlPattern(line.raw);
  }, [line.raw]);

  // 3. Detect Java Exception & Stacktrace (analyzing full multiline block)
  const detectedJava = useMemo(() => {
    let nextLines: string[] | undefined;
    if (allLines && allLines.length > 0) {
      const idx = allLines.findIndex((l) => l.rawIndex === line.rawIndex);
      if (idx !== -1) {
        nextLines = allLines.slice(idx + 1, idx + 45).map((l) => l.raw);
      }
    }
    return detectJavaErrorPattern(fullRawMessage, nextLines);
  }, [fullRawMessage, line.rawIndex, allLines]);

  // 4. Extract operational entities (UUIDs, file paths, URLs) from the full block
  const detectedEntities = useMemo(() => {
    return extractLogEntities(fullRawMessage);
  }, [fullRawMessage]);

  // 5. Detect Git & Jenkins Pipeline operations, branches, and conflicts
  const detectedGit = useMemo(() => {
    return detectGitPipeline(fullRawMessage);
  }, [fullRawMessage]);

  const [copiedEntityKey, setCopiedEntityKey] = useState<string | null>(null);

  const handleCopyEntity = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedEntityKey(key);
      setTimeout(() => setCopiedEntityKey(null), 1500);
    } catch (err) {
      console.error('Failed to copy entity value:', err);
    }
  };

  const handleCopyGitEntity = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedGitEntity(value);
      setTimeout(() => setCopiedGitEntity(null), 1500);
    } catch (err) {
      console.error('Failed to copy git entity:', err);
    }
  };

  const handleCopyRaw = async () => {
    try {
      await navigator.clipboard.writeText(fullRawMessage);
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

            {/* Extracted UUIDs */}
            {detectedEntities.uuids.map((uuid, i) => {
              const label = detectedEntities.uuids.length === 1 ? 'UUID' : `UUID ${i + 1}`;
              const copyKey = `uuid-${i}`;
              return (
                <div key={copyKey} className="detail-meta-item detail-meta-item-copyable">
                  <span className="detail-meta-label">{label}:</span>
                  <div className="detail-meta-value-container">
                    <span className="detail-meta-value" title={uuid}>{uuid}</span>
                    <button
                      type="button"
                      className="detail-copy-btn"
                      onClick={() => handleCopyEntity(uuid, copyKey)}
                      title={t('common.copy')}
                    >
                      {copiedEntityKey === copyKey ? (
                        <IconCheck size={12} stroke={1.5} className="copy-success-icon" />
                      ) : (
                        <IconCopy size={12} stroke={1.5} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Extracted File Paths (Rendered full width so long paths never truncate) */}
            {detectedEntities.filePaths.map((filePath, i) => {
              const label = detectedEntities.filePaths.length === 1
                ? t('detail.filePath')
                : `${t('detail.filePath')} ${i + 1}`;
              const copyKey = `path-${i}`;
              return (
                <div key={copyKey} className="detail-meta-item detail-meta-item-copyable detail-meta-item-fullwidth">
                  <span className="detail-meta-label">{label}:</span>
                  <div className="detail-meta-value-container">
                    <span className="detail-meta-value" title={filePath}>{filePath}</span>
                    <button
                      type="button"
                      className="detail-copy-btn"
                      onClick={() => handleCopyEntity(filePath, copyKey)}
                      title={t('common.copy')}
                    >
                      {copiedEntityKey === copyKey ? (
                        <IconCheck size={12} stroke={1.5} className="copy-success-icon" />
                      ) : (
                        <IconCopy size={12} stroke={1.5} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Extracted URLs */}
            {detectedEntities.urls.map((url, i) => {
              const label = detectedEntities.urls.length === 1 ? 'URL' : `URL ${i + 1}`;
              const copyKey = `url-${i}`;
              return (
                <div key={copyKey} className="detail-meta-item detail-meta-item-copyable">
                  <span className="detail-meta-label">{label}:</span>
                  <div className="detail-meta-value-container">
                    <span className="detail-meta-value" title={url}>{url}</span>
                    <button
                      type="button"
                      className="detail-copy-btn"
                      onClick={() => handleCopyEntity(url, copyKey)}
                      title={t('common.copy')}
                    >
                      {copiedEntityKey === copyKey ? (
                        <IconCheck size={12} stroke={1.5} className="copy-success-icon" />
                      ) : (
                        <IconCopy size={12} stroke={1.5} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
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

          {/* 4. Git & Jenkins Pipeline Section (Rendered if git operations/branches/conflicts detected) */}
          {detectedGit && (
            <div className="log-detail-section">
              <div className="detail-section-header">
                <h4>
                  <IconGitBranch size={16} stroke={1.5} style={{ color: 'var(--accent)' }} />
                  <span>{t('detail.detectedGitPipeline')}</span>
                  {detectedGit.operation && (
                    <span className={`detail-tag-method detail-git-op-${detectedGit.operation}`}>
                      {detectedGit.operation.toUpperCase()}
                    </span>
                  )}
                </h4>
              </div>

              <div className="detail-git-card">
                {/* Conflict Alert Banner */}
                {detectedGit.conflictFile && (
                  <div className="detail-conflict-banner">
                    <IconAlertTriangle size={16} stroke={1.5} className="conflict-icon" />
                    <div className="conflict-body">
                      <strong>{t('detail.gitConflict')}:</strong>
                      <code className="conflict-file-path">{detectedGit.conflictFile}</code>
                    </div>
                    <button
                      type="button"
                      className="detail-copy-btn-inline"
                      onClick={() => handleCopyGitEntity(detectedGit.conflictFile!)}
                      title={t('detail.copyConflictFile')}
                    >
                      {copiedGitEntity === detectedGit.conflictFile ? (
                        <IconCheck size={13} stroke={1.5} className="copy-success-icon" />
                      ) : (
                        <IconCopy size={13} stroke={1.5} />
                      )}
                    </button>
                  </div>
                )}

                {/* Primary Branch / Merge Target */}
                {detectedGit.branch && (
                  <div className="detail-git-row">
                    <span className="git-row-label">
                      {detectedGit.isMergeDelimiter ? t('detail.gitMergeTarget') : t('detail.gitBranch')}:
                    </span>
                    <div className="git-branch-chip">
                      <IconGitBranch size={13} stroke={1.5} />
                      <code>{detectedGit.branch}</code>
                      <button
                        type="button"
                        className="chip-copy-btn"
                        onClick={() => handleCopyGitEntity(detectedGit.branch!)}
                        title={t('detail.copyBranch')}
                      >
                        {copiedGitEntity === detectedGit.branch ? (
                          <IconCheck size={12} stroke={1.5} className="copy-success-icon" />
                        ) : (
                          <IconCopy size={12} stroke={1.5} />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Strategy info if Ort or Recursive */}
                {detectedGit.strategy && (
                  <div className="detail-git-row">
                    <span className="git-row-label">{t('detail.gitStrategy')}:</span>
                    <span className="git-row-val">{detectedGit.strategy}</span>
                  </div>
                )}

                {/* Multiple detected branches */}
                {detectedGit.branches.length > 1 && (
                  <div className="detail-git-multiple-branches">
                    <span className="git-row-label">{t('detail.gitBranches')} ({detectedGit.branches.length}):</span>
                    <div className="git-branches-list">
                      {detectedGit.branches.map((b) => (
                        <div key={b} className="git-branch-chip">
                          <IconGitBranch size={13} stroke={1.5} />
                          <code>{b}</code>
                          <button
                            type="button"
                            className="chip-copy-btn"
                            onClick={() => handleCopyGitEntity(b)}
                            title={t('detail.copyBranch')}
                          >
                            {copiedGitEntity === b ? (
                              <IconCheck size={12} stroke={1.5} className="copy-success-icon" />
                            ) : (
                              <IconCopy size={12} stroke={1.5} />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. Raw Log Message (Rendered AFTER all structured sections, includes continuations) */}
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
            <pre className="detail-raw-content">{fullRawMessage}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
