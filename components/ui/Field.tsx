import React, {useId} from 'react';
import {cx} from './cx';

type BaseProps = {
    label: string;
    hint?: string;
    error?: string;
    required?: boolean;
    className?: string;
    id?: string;
};

type InputFieldProps = BaseProps & {as?: 'input'} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'>;
type TextareaFieldProps = BaseProps & {as: 'textarea'} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className'>;
type SelectFieldProps = BaseProps & {as: 'select'} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'className'>;

export type FieldProps = InputFieldProps | TextareaFieldProps | SelectFieldProps;

/**
 * Labelled native control. Keep using input / textarea / select (never a
 * contenteditable stand-in) so the existing speech-to-text focus path works.
 */
export const Field: React.FC<FieldProps> = (props) => {
    const generatedId = useId();
    const id = props.id ?? generatedId;
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const describedBy = [props.hint ? hintId : null, props.error ? errorId : null].filter(Boolean).join(' ') || undefined;
    const invalid = Boolean(props.error);
    const {label, hint, error, required, className, as = 'input', ...rest} = props;

    const controlClass = cx('ds-field-control', 'ds-control', invalid && 'ds-field-invalid');

    let control: React.ReactNode;
    if (as === 'textarea') {
        const textareaProps = rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>;
        control = (
            <textarea
                id={id}
                className={controlClass}
                required={required}
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
                {...textareaProps}
            />
        );
    } else if (as === 'select') {
        const selectProps = rest as React.SelectHTMLAttributes<HTMLSelectElement>;
        control = (
            <select
                id={id}
                className={controlClass}
                required={required}
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
                {...selectProps}
            />
        );
    } else {
        const inputProps = rest as React.InputHTMLAttributes<HTMLInputElement>;
        control = (
            <input
                id={id}
                className={controlClass}
                required={required}
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
                {...inputProps}
            />
        );
    }

    return (
        <div className={cx('ds-root', 'ds-field', className)}>
            <label className="ds-field-label" htmlFor={id}>
                {label}
                {required ? <span className="t-danger"> ＊</span> : null}
            </label>
            {control}
            {hint && !error ? <p id={hintId} className="ds-field-hint">{hint}</p> : null}
            {error ? <p id={errorId} className="ds-field-error" role="alert">{error}</p> : null}
        </div>
    );
};
