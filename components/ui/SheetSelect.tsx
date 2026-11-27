import React, {useLayoutEffect, useRef, useState} from 'react';
import {BottomSheet} from './BottomSheet';
import {Button} from './Button';
import {WheelPicker, type WheelOption} from './WheelPicker';
import {cx} from './cx';
import {Icon} from './Icon';

/**
 * Sheet select (stage S4): the page's own native <select> — same <option>
 * literals, same value, same onChange — stays in the DOM (hidden) as the
 * source of truth. The visible control is a field-shaped button that opens a
 * bottom sheet: a wheel (pending; applied on 完成) or, for long grouped lists,
 * a list of rows (a tap picks and closes). Picking sets the native select's
 * value and fires a real `change` event, so the original handler runs
 * unchanged (including handlers that reset the select afterwards).
 */
export interface SheetSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'title'> {
    /** Sheet title (also the trigger's accessible name prefix). */
    sheetTitle: string;
    mode?: 'wheel' | 'list';
    /** Trigger label when the select has no visible choice (value ''). */
    placeholderLabel?: string;
    triggerClassName?: string;
}

type ReadOption = {value: string; label: string; group?: string; disabled?: boolean};

function readOptions(select: HTMLSelectElement | null): ReadOption[] {
    if (!select) return [];
    return [...select.options].map((o) => ({
        value: o.value,
        label: o.text,
        group: o.parentElement instanceof HTMLOptGroupElement ? o.parentElement.label : undefined,
        disabled: o.disabled,
    }));
}

export function SheetSelect({sheetTitle, mode = 'wheel', placeholderLabel, triggerClassName, id, className, children, 'aria-label': ariaLabel, ...selectProps}: SheetSelectProps) {
    const selectRef = useRef<HTMLSelectElement>(null);
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState('');
    const [current, setCurrent] = useState<ReadOption | null>(null);
    const [options, setOptions] = useState<ReadOption[]>([]);

    // Mirror what the native select shows (it is the source of truth).
    useLayoutEffect(() => {
        const sel = selectRef.current;
        if (!sel) return;
        const o = sel.selectedOptions[0];
        const next = o ? {value: o.value, label: o.text} : null;
        if (next?.value !== current?.value || next?.label !== current?.label) setCurrent(next);
    });

    const apply = (value: string) => {
        const sel = selectRef.current;
        if (!sel) return;
        const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
        setter?.call(sel, value);
        sel.dispatchEvent(new Event('change', {bubbles: true}));
    };

    const openSheet = () => {
        const opts = readOptions(selectRef.current);
        setOptions(opts);
        setPending(selectRef.current?.value || (mode === 'wheel' ? opts.find((o) => o.value !== '' && !o.disabled)?.value ?? '' : ''));
        setOpen(true);
    };

    const shown = current && current.value !== '' ? current.label : (placeholderLabel ?? current?.label ?? '');
    const wheelOptions: WheelOption[] = options.filter((o) => o.value !== '').map((o) => ({value: o.value, label: o.label, disabled: o.disabled}));

    return (
        <>
            <select ref={selectRef} hidden tabIndex={-1} aria-hidden className={className} {...selectProps}>
                {children}
            </select>
            <button
                type="button"
                id={id}
                className={cx('ds-field-control ds-control ds-sheet-select', triggerClassName, (!current || current.value === '') && 'is-placeholder')}
                aria-haspopup="dialog"
                aria-label={ariaLabel ? `${ariaLabel}：${shown}` : undefined}
                onClick={openSheet}
            >
                <span className="ds-sheet-select-value">{shown}</span>
                <Icon name="expand" size={20} />
            </button>
            {mode === 'wheel' ? (
                <BottomSheet
                    open={open}
                    onClose={() => setOpen(false)}
                    title={sheetTitle}
                    hint="滾動選擇，按「完成」後才會套用。"
                    hideClose
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => setOpen(false)}>取消</Button>
                            <Button onClick={() => { apply(pending); setOpen(false); }}>完成</Button>
                        </>
                    }
                >
                    <WheelPicker aria-label={sheetTitle} options={wheelOptions} value={pending || wheelOptions[0]?.value || ''} onChange={setPending} />
                </BottomSheet>
            ) : (
                <BottomSheet open={open} onClose={() => setOpen(false)} title={sheetTitle}>
                    <div className="ds-sheet-list" role="listbox" aria-label={sheetTitle}>
                        {options.filter((o) => o.value !== '').map((o, i, arr) => (
                            <React.Fragment key={o.value}>
                                {o.group && o.group !== arr[i - 1]?.group && <p className="t-caption ds-sheet-list-group">{o.group}</p>}
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={o.value === pending}
                                    disabled={o.disabled}
                                    className="ds-sheet-list-row ds-control"
                                    onClick={() => { apply(o.value); setOpen(false); }}
                                >
                                    <span>{o.label}</span>
                                    {o.value === pending && <Icon name="check" size={20} />}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>
                </BottomSheet>
            )}
        </>
    );
}
