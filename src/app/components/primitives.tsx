import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconX } from '@tabler/icons-react';

export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="var(--border-strong)" />
      <path d="M7 8h10" stroke="var(--accent)" strokeWidth="2.5" />
      <path d="M7 12h6" stroke="currentColor" strokeWidth="2" opacity="0.85" />
      <path d="M7 16h8" stroke="currentColor" strokeWidth="2" opacity="0.6" />
      <circle cx="17" cy="14" r="2.5" stroke="var(--mark)" strokeWidth="1.8" />
    </svg>
  );
}

interface DialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'small' | 'medium' | 'large';
  hideTitle?: boolean;
  closeOnScrimClick?: boolean;
}

export function Dialog({
  title,
  onClose,
  children,
  size = 'medium',
  hideTitle = false,
  closeOnScrimClick = true,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className="dialog-scrim"
      onClick={(e) => {
        if (closeOnScrimClick && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={`dialog ${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {!hideTitle && (
          <div className="dialog-header">
            <span className="dialog-title">{title}</span>
            <button
              type="button"
              className="dialog-close"
              onClick={onClose}
              title="Close (Esc)"
              aria-label="Close"
            >
              <IconX size={18} stroke={1.5} />
            </button>
          </div>
        )}
        <div className="dialog-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function Switch({
  checked,
  onChange,
  disabled = false,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <label className="switch" title={label}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch-slider" />
    </label>
  );
}

export { Select } from './Select.tsx';
export type { SelectOption } from './Select.tsx';

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: Array<[T, string]>;
  onChange: (value: T) => void;
  label?: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map(([val, text]) => (
        <button
          key={val}
          type="button"
          role="radio"
          aria-checked={value === val}
          className={value === val ? 'is-active' : ''}
          onClick={() => onChange(val)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
