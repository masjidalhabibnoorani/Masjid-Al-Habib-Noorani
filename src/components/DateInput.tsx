import React, { useState, useEffect, useRef } from 'react';
import { Calendar, RotateCcw, Check } from 'lucide-react';
import { formatDateStr, toHtmlDateValue, parseDateToDate } from '../types';

interface DateInputProps {
  id?: string;
  value?: string | Date;
  onChange: (dateStr: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  showTodayButton?: boolean;
  disabled?: boolean;
  badgeColor?: 'emerald' | 'rose' | 'amber' | 'pine';
}

/**
 * High-performance, smooth Date Input Component enforcing DD/MM/YYYY.
 * - Allows natural freeform typing (DD/MM/YYYY or DDMMYYYY).
 * - Never jumps cursor or interferes during typing/backspacing.
 * - Integrates with visual calendar picker.
 * - Quick "Today" (آج) button.
 * - Auto-normalizes on blur.
 */
export const DateInput: React.FC<DateInputProps> = ({
  id,
  value = '',
  onChange,
  label,
  placeholder = 'DD/MM/YYYY (e.g. 15/08/2026)',
  required = false,
  className = '',
  inputClassName = '',
  showTodayButton = true,
  disabled = false,
  badgeColor = 'emerald'
}) => {
  const formatInitial = (val: string | Date | undefined | null): string => {
    if (!val) return '';
    return formatDateStr(val);
  };

  const [textValue, setTextValue] = useState<string>(() => formatInitial(value));
  const isFocusedRef = useRef(false);
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);

  // Sync external value ONLY when not actively typing/focused
  useEffect(() => {
    if (!isFocusedRef.current) {
      setTextValue(formatInitial(value));
    }
  }, [value]);

  // Handle typing smoothly without breaking backspaces or cursor jumps
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    
    // Allow digits, slashes, dashes, dots
    let cleaned = raw.replace(/[^\d\/\-\.]/g, '');
    
    // Auto-mask if user types pure 8 digits without slashes (e.g. 15082026 -> 15/08/2026)
    if (/^\d{8}$/.test(cleaned)) {
      cleaned = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    }

    setTextValue(cleaned);
    onChange(cleaned);
  };

  // On blur, normalize standard formats like 15-8-2026 or 15/8/2026 into 15/08/2026
  const handleBlur = () => {
    isFocusedRef.current = false;
    const trimmed = textValue.trim();
    if (!trimmed) {
      setTextValue('');
      onChange('');
      return;
    }

    // Match DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY with 1 or 2 digit day/month
    const match = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
    if (match) {
      const dd = String(match[1]).padStart(2, '0');
      const mm = String(match[2]).padStart(2, '0');
      let yyyy = match[3];
      if (yyyy.length === 2) {
        yyyy = '20' + yyyy;
      }
      const formatted = `${dd}/${mm}/${yyyy}`;
      setTextValue(formatted);
      onChange(formatted);
    } else {
      // Keep as is or formatted
      const formatted = formatDateStr(trimmed);
      setTextValue(formatted);
      onChange(formatted);
    }
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  // When user selects date from calendar popup
  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ymdValue = e.target.value; // 'YYYY-MM-DD'
    if (!ymdValue) {
      setTextValue('');
      onChange('');
      return;
    }
    const dmy = formatDateStr(ymdValue);
    setTextValue(dmy);
    onChange(dmy);
  };

  // Open native calendar picker
  const openDatePicker = () => {
    if (disabled) return;
    if (hiddenDateInputRef.current) {
      try {
        if ('showPicker' in HTMLInputElement.prototype) {
          hiddenDateInputRef.current.showPicker();
        } else {
          hiddenDateInputRef.current.focus();
          hiddenDateInputRef.current.click();
        }
      } catch {
        hiddenDateInputRef.current.focus();
        hiddenDateInputRef.current.click();
      }
    }
  };

  // Set today's date in DD/MM/YYYY format
  const setTodayDate = () => {
    if (disabled) return;
    const now = new Date();
    const dmy = formatDateStr(now);
    setTextValue(dmy);
    onChange(dmy);
  };

  // Clear date
  const clearDate = () => {
    if (disabled) return;
    setTextValue('');
    onChange('');
  };

  // Badge styling
  const badgeColors = {
    emerald: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
    rose: 'text-rose-400 bg-rose-950/40 border-rose-800/60',
    amber: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
    pine: 'text-pine-btn-hover bg-pine-btn/20 border-pine-btn/40'
  };

  const activeColor = badgeColors[badgeColor] || badgeColors.emerald;

  // HTML5 date value for the calendar picker
  const parsedDate = parseDateToDate(textValue) || parseDateToDate(value);
  const htmlDateVal = toHtmlDateValue(parsedDate);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <div className="flex justify-between items-center mb-1">
          <label htmlFor={id} className="block text-[10px] sm:text-xs uppercase tracking-wider text-pine-text-body font-bold">
            {label} {required && <span className="text-rose-400">*</span>}
          </label>
          <div className="flex items-center gap-1.5">
            {textValue && (
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${activeColor}`}>
                {textValue}
              </span>
            )}
            <span className="text-[9px] text-zinc-500 font-mono">
              [DD/MM/YYYY]
            </span>
          </div>
        </div>
      )}

      <div className="relative flex items-center">
        {/* Main Text Input for DD/MM/YYYY */}
        <input
          id={id}
          type="text"
          value={textValue}
          onChange={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          maxLength={10}
          className={`w-full bg-pine-bar/60 border border-pine-border py-2 pl-3 pr-24 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-pine-btn font-mono transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${inputClassName}`}
        />

        {/* Hidden native calendar input for date picker */}
        <input
          ref={hiddenDateInputRef}
          type="date"
          tabIndex={-1}
          value={htmlDateVal}
          onChange={handleNativePickerChange}
          disabled={disabled}
          className="sr-only absolute pointer-events-none opacity-0"
          aria-hidden="true"
        />

        {/* Quick action buttons */}
        <div className="absolute right-1.5 flex items-center gap-1">
          {showTodayButton && (
            <button
              type="button"
              onClick={setTodayDate}
              disabled={disabled}
              title="Set to Today (آج کی تاریخ)"
              className="px-1.5 py-1 text-[10px] font-bold bg-pine-btn/30 hover:bg-pine-btn/60 text-emerald-300 rounded border border-pine-border hover:border-emerald-500/50 transition-all cursor-pointer flex items-center gap-0.5"
            >
              <Check className="w-2.5 h-2.5" />
              <span>Today</span>
            </button>
          )}

          {textValue && (
            <button
              type="button"
              onClick={clearDate}
              disabled={disabled}
              title="Clear Date"
              className="p-1 text-zinc-400 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            onClick={openDatePicker}
            disabled={disabled}
            title="Open Calendar (کیلنڈر کھولیں)"
            className="p-1.5 text-pine-text-muted hover:text-emerald-400 hover:bg-pine-hover/30 rounded-md transition-colors cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateInput;
