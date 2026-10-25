import { useEffect, useRef, useState } from 'react';
import { IconCheck, IconSearch, IconSelector } from '@tabler/icons-react';
import { t } from '../i18n/index.ts';
import { Popover } from './Popover.tsx';

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
  detail?: string;
  icon?: React.ReactNode;
}

export function foldText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function Select<T extends string | number>({
  value,
  options,
  onChange,
  label,
  placeholder = 'Choose',
  footer,
  disabled,
}: {
  value: T | null;
  options: Array<SelectOption<T>>;
  onChange: (value: T) => void;
  label: string;
  placeholder?: string;
  footer?: { label: string; onSelect: () => void };
  disabled?: boolean;
}) {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const current = options.find((option) => option.value === value);

  return (
    <>
      <button
        type="button"
        className="select-button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={anchor !== null}
        disabled={disabled}
        onClick={(event) => setAnchor(anchor ? null : event.currentTarget)}
      >
        <span
          className={`select-label-wrapper ${current || value ? '' : 'select-placeholder'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: 0 }}
        >
          {current?.icon && (
            <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--accent)', flex: 'none' }}>
              {current.icon}
            </span>
          )}
          <span>{current?.label ?? (value !== null && value !== undefined ? String(value) : placeholder)}</span>
        </span>
        <IconSelector size={15} stroke={1.5} />
      </button>
      {anchor && (
        <SelectList
          anchor={anchor}
          label={label}
          value={value}
          options={options}
          footer={footer}
          onClose={() => setAnchor(null)}
          onPick={(picked) => {
            setAnchor(null);
            anchor.focus();
            if (picked !== value) onChange(picked);
          }}
        />
      )}
    </>
  );
}

function SelectList<T extends string | number>({
  anchor,
  label,
  value,
  options,
  footer,
  onClose,
  onPick,
}: {
  anchor: HTMLElement;
  label: string;
  value: T | null;
  options: Array<SelectOption<T>>;
  footer?: { label: string; onSelect: () => void };
  onClose: () => void;
  onPick: (value: T) => void;
}) {
  const searchable = options.length > 8;
  const [query, setQuery] = useState('');
  const folded = foldText(query.trim());
  const shown = folded
    ? options.filter((option) => foldText(`${option.label} ${option.detail ?? ''}`).includes(folded))
    : options;
  const [active, setActive] = useState(() =>
    Math.max(
      0,
      options.findIndex((option) => option.value === value),
    ),
  );
  const list = useRef<HTMLUListElement>(null);
  const at = Math.min(active, Math.max(0, shown.length - 1));

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${at}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [at]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((at + step + shown.length) % Math.max(1, shown.length));
    } else if (event.key === 'Enter' && shown[at]) {
      event.preventDefault();
      onPick(shown[at].value);
    }
  };

  return (
    <Popover
      anchor={anchor}
      onClose={onClose}
      label={label}
      className="select-popover"
      placement="bottom-end"
    >
      <div
        className="select-body"
        style={{ width: Math.max(anchor.offsetWidth, 240) }}
        tabIndex={-1}
        data-autofocus={searchable ? undefined : true}
        onKeyDown={onKeyDown}
      >
        {searchable && (
          <label className="select-search">
            <IconSearch size={14} stroke={1.5} />
            <input
              data-autofocus
              placeholder={t('common.search')}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
            />
          </label>
        )}
        <ul className="select-options" role="listbox" aria-label={label} ref={list}>
          {shown.map((option, index) => (
            <li key={String(option.value)}>
              <button
                type="button"
                role="option"
                data-index={index}
                aria-selected={option.value === value}
                className={`select-option${index === at ? ' is-active' : ''}`}
                onMouseMove={() => index !== at && setActive(index)}
                onClick={() => onPick(option.value)}
              >
                <span
                  className="select-option-content"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}
                >
                  {option.icon && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--accent)', flex: 'none' }}>
                      {option.icon}
                    </span>
                  )}
                  <span className="select-option-text">
                    <span>{option.label}</span>
                    {option.detail && <span className="select-option-detail">{option.detail}</span>}
                  </span>
                </span>
                {option.value === value && <IconCheck size={14} stroke={1.5} />}
              </button>
            </li>
          ))}
          {shown.length === 0 && <li className="select-empty">No matches found</li>}
        </ul>
        {footer && (
          <button
            type="button"
            className="select-footer"
            onClick={() => {
              onClose();
              footer.onSelect();
            }}
          >
            {footer.label}
          </button>
        )}
      </div>
    </Popover>
  );
}
