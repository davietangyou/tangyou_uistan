import React, {useEffect, useState} from 'react';

/**
 * R2-8: a quiet reassurance under a long AI wait. Mount it inside the loading
 * state; it appears only once the wait has gone on for `delayMs` and disappears
 * with the loading state (reply or error). UI copy only — the request, the
 * locked loading line above it and the reply are untouched.
 */
export const SLOW_WAIT_TEXT = '仍在整理中，內容較多時需要多一點時間。可以先到其他頁面，完成後會留在這裡。';

export function SlowWaitNote({delayMs = 8000, className}: {delayMs?: number; className?: string}) {
    const [shown, setShown] = useState(false);
    useEffect(() => {
        const t = window.setTimeout(() => setShown(true), delayMs);
        return () => window.clearTimeout(t);
    }, [delayMs]);
    if (!shown) return null;
    return <p className={`t-caption t-ink-2 ds-slow-note${className ? ` ${className}` : ''}`}>{SLOW_WAIT_TEXT}</p>;
}
