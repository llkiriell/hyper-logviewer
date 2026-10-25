import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { computePosition, flip, offset, shift } from '@floating-ui/dom';
import type { Icon as TablerIcon } from '@tabler/icons-react';

export type ContextMenuEntry =
  | {
      label: string;
      icon?: TablerIcon;
      shortcut?: string;
      danger?: boolean;
      disabled?: boolean;
      onSelect: () => void;
    }
  | { separator: true };

interface ContextMenuProps {
  anchor: DOMRect;
  entries: ContextMenuEntry[];
  onClose: () => void;
}

export function ContextMenu({ anchor, entries, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const reference = {
      getBoundingClientRect: () => anchor,
    };

    void computePosition(reference, element, {
      placement: 'bottom-start',
      strategy: 'fixed',
      middleware: [offset(2), flip({ padding: 8 }), shift({ padding: 8 })],
    }).then(({ x, y }) => {
      element.style.left = `${Math.round(x)}px`;
      element.style.top = `${Math.round(y)}px`;
      element.style.visibility = 'visible';
    });

    element.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
  }, [anchor]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        closeRef.current();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeRef.current();
      }
    };

    const handleBlurWindow = () => {
      closeRef.current();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlurWindow);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlurWindow);
    };
  }, []);

  return createPortal(
    <div
      ref={ref}
      className="context-menu"
      role="menu"
      tabIndex={-1}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        visibility: 'hidden',
        zIndex: 9999,
      }}
    >
      {entries.map((entry, index) => {
        if ('separator' in entry) {
          return <div key={index} className="context-menu-separator" role="separator" />;
        }

        const Icon = entry.icon;

        return (
          <button
            key={index}
            type="button"
            role="menuitem"
            className={`context-menu-item ${entry.danger ? 'is-danger' : ''}`}
            disabled={entry.disabled}
            onClick={() => {
              entry.onSelect();
              onClose();
            }}
          >
            {Icon && <Icon size={16} stroke={1.5} className="context-menu-icon" />}
            <span className="context-menu-label">{entry.label}</span>
            {entry.shortcut && (
              <span className="context-menu-shortcut">{entry.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
