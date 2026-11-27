import React, {useEffect, useId, useLayoutEffect, useRef, useState} from 'react';
import {cx} from './cx';

/**
 * Wheel picker (stage S3): the iOS-style wheel elders already know. Items
 * snap to the centre; the centred item is the pending choice. It never
 * applies anything by itself — the sheet around it applies on 完成, so a
 * stray scroll changes nothing ("滾動選擇，按「完成」後才會套用").
 *
 * Options must come from the page's existing option data (the native
 * <select>/<option> literals or constants stay where the goldens read them).
 * Keyboard: ↑/↓, Home/End; it is an ARIA listbox.
 */
export interface WheelOption<T extends string = string> {
    value: T;
    label: React.ReactNode;
    disabled?: boolean;
}

export interface WheelPickerProps<T extends string = string> {
    options: ReadonlyArray<WheelOption<T>>;
    value: T;
    onChange: (value: T) => void;
    'aria-label': string;
    /** Visible rows (odd). */
    rows?: 3 | 5;
    className?: string;
}

const ROW = 58;

export function WheelPicker<T extends string = string>({options, value, onChange, rows = 5, className, 'aria-label': ariaLabel}: WheelPickerProps<T>) {
    const ref = useRef<HTMLDivElement>(null);
    const id = useId();
    const settleTimer = useRef<number | undefined>(undefined);
    const programmatic = useRef(false);
    const index = Math.max(0, options.findIndex((o) => o.value === value));
    const [centre, setCentre] = useState(index);

    // Keep the wheel on the value when it changes from outside.
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (Math.round(el.scrollTop / ROW) === index) return;
        programmatic.current = true;
        el.scrollTop = index * ROW;
        setCentre(index);
        window.setTimeout(() => { programmatic.current = false; }, 50);
    }, [index]);

    useEffect(() => () => window.clearTimeout(settleTimer.current), []);

    const pick = (i: number) => {
        const clamped = Math.min(options.length - 1, Math.max(0, i));
        let j = clamped;
        while (options[j]?.disabled && j < options.length - 1) j += 1;
        const opt = options[j];
        if (!opt || opt.disabled) return;
        if (opt.value !== value) onChange(opt.value);
        ref.current?.scrollTo({top: j * ROW, behavior: 'smooth'});
    };

    const onScroll = () => {
        const el = ref.current;
        if (!el) return;
        const i = Math.round(el.scrollTop / ROW);
        setCentre(i);
        if (programmatic.current) return;
        window.clearTimeout(settleTimer.current);
        settleTimer.current = window.setTimeout(() => {
            const opt = options[Math.min(options.length - 1, Math.max(0, i))];
            if (opt && !opt.disabled && opt.value !== value) onChange(opt.value);
        }, 90);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        const map: Record<string, number> = {ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: options.length - 1};
        if (!(e.key in map)) return;
        e.preventDefault();
        pick(map[e.key]);
    };

    const pad = ((rows - 1) / 2) * ROW;
    return (
        <div className={cx('ds-wheel', className)} style={{'--wheel-rows': rows, '--wheel-row': `${ROW}px`} as React.CSSProperties}>
            <div className="ds-wheel-band" aria-hidden />
            <div
                ref={ref}
                className="ds-wheel-scroller"
                role="listbox"
                tabIndex={0}
                aria-label={ariaLabel}
                aria-activedescendant={`${id}-${index}`}
                onScroll={onScroll}
                onKeyDown={onKeyDown}
                style={{paddingTop: pad, paddingBottom: pad}}
            >
                {options.map((o, i) => (
                    <div
                        key={o.value}
                        id={`${id}-${i}`}
                        role="option"
                        aria-selected={i === index}
                        aria-disabled={o.disabled || undefined}
                        className={cx('ds-wheel-item', i === centre && 'is-centre', Math.abs(i - centre) === 1 && 'is-near')}
                        onClick={() => pick(i)}
                    >
                        {o.label}
                    </div>
                ))}
            </div>
        </div>
    );
}
