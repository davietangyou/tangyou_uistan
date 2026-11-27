import {cx} from './cx';

export interface SegmentedOption<T extends string = string> {
    value: T;
    label: string;
    disabled?: boolean;
}

export interface SegmentedProps<T extends string = string> {
    name: string;
    value: T;
    options: ReadonlyArray<SegmentedOption<T>>;
    onChange: (value: T) => void;
    'aria-label'?: string;
    className?: string;
}

export function Segmented<T extends string = string>({
    name,
    value,
    options,
    onChange,
    className,
    'aria-label': ariaLabel,
}: SegmentedProps<T>) {
    return (
        <div
            className={cx('ds-root', 'ds-segmented', className)}
            role="radiogroup"
            aria-label={ariaLabel}
        >
            {options.map((option) => {
                const checked = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        name={name}
                        className="ds-seg-btn ds-control"
                        data-verify={name ? `${name}-${option.value}` : undefined}
                        aria-checked={checked}
                        disabled={option.disabled}
                        onClick={() => onChange(option.value)}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
