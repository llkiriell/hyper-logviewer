import type { ReactNode } from 'react';

export function SettingsGroup({ children }: { children: ReactNode }) {
  return <div className="settings-group">{children}</div>;
}

export function SettingRow({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <div className="setting-row">
      <div className="setting-info">
        <span className="setting-label">{label}</span>
        {help && <span className="setting-help">{help}</span>}
      </div>
      <div className="setting-control">{children}</div>
    </div>
  );
}
