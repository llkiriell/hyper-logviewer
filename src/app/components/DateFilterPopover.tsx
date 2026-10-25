import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { computePosition, flip, offset, shift } from '@floating-ui/dom';
import {
  IconCalendar,
  IconClock,
  IconFileExport,
  IconX,
} from '@tabler/icons-react';
import type { DateRangeFilter } from '../../core/types.ts';
import { useTranslation } from '../i18n/index.ts';

interface DateFilterPopoverProps {
  anchor: HTMLElement;
  onClose: () => void;
  filter: DateRangeFilter;
  onChange: (filter: DateRangeFilter) => void;
  minDate?: string;
  maxDate?: string;
  onExtractDateToTab?: (dateStr: string) => void;
}

export function DateFilterPopover({
  anchor,
  onClose,
  filter,
  onChange,
  minDate,
  maxDate,
  onExtractDateToTab,
}: DateFilterPopoverProps) {
  const { t } = useTranslation();
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const [mode, setMode] = useState<'range' | 'single'>(filter.mode);
  const [startDate, setStartDate] = useState(filter.startDate ?? minDate ?? '');
  const [endDate, setEndDate] = useState(filter.endDate ?? maxDate ?? '');
  const [singleDate, setSingleDate] = useState(filter.singleDate ?? minDate ?? '');
  const [startTime, setStartTime] = useState(filter.startTime ?? '00:00');
  const [endTime, setEndTime] = useState(filter.endTime ?? '23:59');

  useLayoutEffect(() => {
    const element = popoverRef.current;
    if (!element) return;

    void computePosition(anchor, element, {
      placement: 'bottom-start',
      strategy: 'fixed',
      middleware: [offset(6), flip({ padding: 8 }), shift({ padding: 8 })],
    }).then(({ x, y }) => {
      element.style.left = `${Math.round(x)}px`;
      element.style.top = `${Math.round(y)}px`;
      element.style.visibility = 'visible';
    });
  }, [anchor]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (popoverRef.current?.contains(event.target as Node)) return;
      if (anchor.contains(event.target as Node)) return;
      closeRef.current();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeRef.current();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [anchor]);

  const handleApply = () => {
    onChange({
      enabled: true,
      mode,
      startDate: mode === 'range' ? startDate : undefined,
      endDate: mode === 'range' ? endDate : undefined,
      singleDate: mode === 'single' ? singleDate : undefined,
      startTime: mode === 'single' ? startTime : undefined,
      endTime: mode === 'single' ? endTime : undefined,
    });
    onClose();
  };

  const handleReset = () => {
    onChange({
      enabled: false,
      mode: 'range',
    });
    onClose();
  };

  const targetDateForExtraction = mode === 'single' ? singleDate : startDate;

  return createPortal(
    <div
      ref={popoverRef}
      className="date-filter-popover"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        visibility: 'hidden',
        zIndex: 9998,
      }}
    >
      <div className="date-popover-header">
        <div className="date-popover-title">
          <IconCalendar size={16} stroke={1.5} />
          <span>{t('viewer.dateFilterTitle')}</span>
        </div>
        <button
          type="button"
          className="search-tool-btn"
          onClick={onClose}
          aria-label={t('common.close')}
        >
          <IconX size={14} stroke={1.5} />
        </button>
      </div>

      <div className="date-popover-body">
        {/* Mode Selector */}
        <div className="date-mode-toggle">
          <button
            type="button"
            className={`date-mode-btn ${mode === 'range' ? 'is-active' : ''}`}
            onClick={() => setMode('range')}
          >
            {t('viewer.dateRange')}
          </button>
          <button
            type="button"
            className={`date-mode-btn ${mode === 'single' ? 'is-active' : ''}`}
            onClick={() => setMode('single')}
          >
            {t('viewer.singleDay')}
          </button>
        </div>

        {mode === 'range' ? (
          <div className="date-inputs-group">
            <div className="date-field">
              <label>{t('viewer.startDate')}</label>
              <input
                type="date"
                value={startDate}
                min={minDate}
                max={maxDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="date-field">
              <label>{t('viewer.endDate')}</label>
              <input
                type="date"
                value={endDate}
                min={minDate}
                max={maxDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="date-inputs-group">
            <div className="date-field">
              <label>{t('viewer.date')}</label>
              <input
                type="date"
                value={singleDate}
                min={minDate}
                max={maxDate}
                onChange={(e) => setSingleDate(e.target.value)}
              />
            </div>

            <div className="time-range-group">
              <div className="date-field">
                <label>
                  <IconClock size={13} stroke={1.5} />
                  <span>{t('viewer.startTime')}</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="date-field">
                <label>
                  <IconClock size={13} stroke={1.5} />
                  <span>{t('viewer.endTime')}</span>
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Action to extract to new tab directly from the popover */}
        {onExtractDateToTab && targetDateForExtraction && (
          <button
            type="button"
            className="extract-date-btn"
            onClick={() => {
              onExtractDateToTab(targetDateForExtraction);
              onClose();
            }}
          >
            <IconFileExport size={15} stroke={1.5} />
            <span>{t('viewer.extractDateTab', { date: targetDateForExtraction })}</span>
          </button>
        )}
      </div>

      <div className="date-popover-footer">
        <button
          type="button"
          className="button button-sm button-ghost"
          onClick={handleReset}
        >
          {t('common.clear')}
        </button>
        <button
          type="button"
          className="button button-sm primary"
          onClick={handleApply}
        >
          {t('common.apply')}
        </button>
      </div>
    </div>,
    document.body,
  );
}
