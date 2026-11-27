/**
 * System back (Android back gesture / browser back) closes the top sub-page,
 * like a native app (stage S2). One history entry per open sub-page; the app
 * itself still has no URL routing.
 */
interface Entry {
    id: string;
    close: () => void;
    /** Pending quiet drop; cancelled if the same sub-page re-registers at once (StrictMode re-runs effects). */
    dropTimer?: number;
}

const stack: Entry[] = [];
let ignorePops = 0;
let installed = false;

function install() {
    if (installed || typeof window === 'undefined') return;
    installed = true;
    window.addEventListener('popstate', () => {
        if (ignorePops > 0) {
            ignorePops -= 1;
            return;
        }
        const top = stack.pop();
        top?.close();
    });
}

/** A sub-page became visible: give it a history entry. */
export function pushSubPage(id: string, close: () => void) {
    install();
    const existing = stack.find((e) => e.id === id);
    if (existing) {
        if (existing.dropTimer !== undefined) window.clearTimeout(existing.dropTimer);
        existing.dropTimer = undefined;
        existing.close = close;
        return;
    }
    stack.push({id, close});
    try {
        window.history.pushState({dsSubPage: id}, '');
    } catch {
        /* history unavailable (sandboxed preview): back button still works in-app */
    }
}

/** A sub-page closed by itself (saved, or its page was left): drop its entry quietly. */
export function dropSubPage(id: string) {
    const entry = stack.find((e) => e.id === id);
    if (!entry || entry.dropTimer !== undefined) return;
    entry.dropTimer = window.setTimeout(() => {
        const i = stack.indexOf(entry);
        if (i < 0) return;
        stack.splice(i, 1);
        ignorePops += 1;
        window.history.back();
    }, 0);
}

/** The in-app back button: same path as the system back. */
export function backFromSubPage(id: string, close: () => void) {
    const i = stack.findIndex((e) => e.id === id);
    if (i === stack.length - 1 && i >= 0) {
        window.history.back();
        return;
    }
    if (i >= 0) stack.splice(i, 1);
    close();
}
