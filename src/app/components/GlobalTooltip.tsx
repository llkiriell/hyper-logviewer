import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { computePosition, flip, offset, shift } from '@floating-ui/dom';

interface TooltipState {
  visible: boolean;
  text: string;
  x: number;
  y: number;
}

export function GlobalTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    text: '',
    x: 0,
    y: 0,
  });

  const timerRef = useRef<number | null>(null);
  const activeElementRef = useRef<Element | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerOver = (e: MouseEvent) => {
      const target = (e.target as Element)?.closest?.('[data-tooltip], [title]');
      if (!target) return;

      // Extract text from data-tooltip or title
      let text = target.getAttribute('data-tooltip');
      if (!text) {
        const titleAttr = target.getAttribute('title');
        if (titleAttr && titleAttr.trim()) {
          text = titleAttr.trim();
          target.setAttribute('data-tooltip', text);
          target.removeAttribute('title'); // Prevent native browser tooltip from firing
        }
      }

      if (!text) return;

      activeElementRef.current = target;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Small ergonomic delay (220ms) before showing tooltip
      timerRef.current = window.setTimeout(() => {
        if (!activeElementRef.current || !target.isConnected) return;

        setTooltip({
          visible: true,
          text: text!,
          x: -9999,
          y: -9999,
        });
      }, 220);
    };

    const hideTooltip = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      activeElementRef.current = null;
      setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    };

    const handlePointerOut = (e: MouseEvent) => {
      const target = (e.target as Element)?.closest?.('[data-tooltip]');
      if (target && target === activeElementRef.current) {
        hideTooltip();
      }
    };

    const handlePointerDown = () => {
      hideTooltip();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hideTooltip();
      }
    };

    document.addEventListener('mouseover', handlePointerOver, true);
    document.addEventListener('mouseout', handlePointerOut, true);
    document.addEventListener('mousedown', handlePointerDown, true);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('mouseover', handlePointerOver, true);
      document.removeEventListener('mouseout', handlePointerOut, true);
      document.removeEventListener('mousedown', handlePointerDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Recalculate exact position once element renders with real width/height
  useEffect(() => {
    if (!tooltip.visible || !activeElementRef.current || !tooltipRef.current) return;
    const target = activeElementRef.current;
    const tooltipEl = tooltipRef.current;

    void computePosition(target, tooltipEl, {
      placement: 'top',
      strategy: 'fixed',
      middleware: [offset(6), flip({ padding: 8 }), shift({ padding: 8 })],
    }).then(({ x, y }) => {
      if (tooltipRef.current) {
        tooltipRef.current.style.left = `${Math.round(x)}px`;
        tooltipRef.current.style.top = `${Math.round(y)}px`;
        tooltipRef.current.style.visibility = 'visible';
      }
    });
  }, [tooltip.visible, tooltip.text]);

  if (!tooltip.visible) return null;

  return createPortal(
    <div
      ref={tooltipRef}
      className="app-floating-tooltip"
      role="tooltip"
      style={{
        position: 'fixed',
        left: `${tooltip.x}px`,
        top: `${tooltip.y}px`,
        visibility: tooltip.x === -9999 ? 'hidden' : 'visible',
      }}
    >
      {tooltip.text}
    </div>,
    document.body,
  );
}
