import { useMemo } from 'react';
import type { TabItem } from '../tabs.ts';
import { formatBytes } from '../platform/fileLoader.ts';
import { usePreferences } from '../platform/preferences.ts';

export function LogView({ tab }: { tab: TabItem }) {
  const prefs = usePreferences();

  // Split lines
  const lines = useMemo(() => {
    return tab.content.split(/\r?\n/);
  }, [tab.content]);

  return (
    <div className="log-view-container">
      <div
        className="log-scroll-area"
        style={{
          fontFamily: prefs.fontFamily || 'var(--font-mono)',
          fontSize: `${prefs.fontSize}px`,
        }}
      >
        <div className="log-lines">
          {lines.map((line, index) => (
            <div
              key={index}
              className={`log-line ${prefs.wordWrap ? 'is-wrapped' : ''}`}
            >
              <span className="log-line-gutter">{index + 1}</span>
              <span className="log-line-text">{line || ' '}</span>
            </div>
          ))}
        </div>
      </div>

      <footer className="log-status-bar">
        <div className="status-item">
          <strong>{tab.title}</strong>
        </div>
        <div className="status-item">
          <span>{lines.length} lines</span>
        </div>
        <div className="status-item">
          <span>{formatBytes(tab.size)}</span>
        </div>
        <div className="status-item">
          <span>{tab.kind === 'clipboard' ? 'Clipboard Buffer' : 'File'}</span>
        </div>
        <div className="status-item" style={{ marginLeft: 'auto' }}>
          <span>UTF-8</span>
        </div>
      </footer>
    </div>
  );
}
