import {scrollRoot} from './scrollRoot';

/**
 * Keyboard (2026-11-28, round 4): the pieces the 問 AI composer proved on an
 * iPhone, shared by every text field in the app (sub-pages, sheets, dialogs,
 * page-level forms).
 *
 * - isTyping / isTextEntry: which focused element raises a keyboard, and which
 *   ones a tap may focus for the user (text-like only: date / time / select /
 *   file keep their native pickers untouched).
 * - keyboardGeometry: the reference app's visible-height rule (frame measured,
 *   open past 120px covered) plus the pan compensation (the usable area ends at
 *   visualViewport.offsetTop + height in page terms).
 * - installTapFocus: a still, short tap on an unfocused text field focuses it
 *   with preventScroll instead of the native tap, so Safari's caret reveal
 *   does not pan the page (the 2nd-tap gap on 問 AI). A field that already has
 *   focus, a long press, a drag, two fingers or a non-touch input are left to
 *   the browser (caret moves, selection, scrolling, VoiceOver, hardware
 *   keyboards all stay native).
 * - revealField: brings the focused field into the visible part of its own
 *   scroller, clear of pinned bars above and below.
 */

const KEYBOARD_INPUT_SKIP = new Set(['button', 'checkbox', 'radio', 'file', 'range', 'submit', 'reset', 'image', 'hidden', 'color']);
const TEXT_INPUT_TYPES = new Set(['', 'text', 'search', 'tel', 'url', 'email', 'password', 'number']);

/** Focused element that raises the on-screen keyboard (as before). */
export function isTyping(el: Element | null): el is HTMLElement {
    if (!el) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName === 'INPUT') return !KEYBOARD_INPUT_SKIP.has((el as HTMLInputElement).type);
    return (el as HTMLElement).isContentEditable;
}

/** A text-like field the tap-focus path may focus on the user's behalf. */
export function isTextEntry(el: Element | null): el is HTMLInputElement | HTMLTextAreaElement {
    if (el instanceof HTMLTextAreaElement) return !el.readOnly && !el.disabled;
    if (el instanceof HTMLInputElement) return TEXT_INPUT_TYPES.has(el.type) && !el.readOnly && !el.disabled;
    return false;
}

/** Fixed layers that own their own scroll and rest on the keyboard. */
export const KEYBOARD_LAYERS = '.ds-subpage, .ds-sheet-scrim, .ds-consult-memo-backdrop, .ds-app-dialog-backdrop';

export interface KeyboardGeometry {
    /** Part of the frame the user can see (reference rule; pan ignored). */
    visible: number;
    /** Frame height that ends at the visual viewport's bottom (pan included). */
    layoutHeight: number;
    /** Frame height covered by the keyboard (and bars above it). */
    covered: number;
    /** How far above the frame's bottom the usable area ends (layers' padding). */
    inset: number;
    zoomed: boolean;
}

export function keyboardGeometry(frame: DOMRect, vv: VisualViewport): KeyboardGeometry {
    const zoomed = Math.abs(vv.scale - 1) > 0.01;
    const top = Math.max(0, frame.top);
    const visible = zoomed ? frame.height : Math.max(0, Math.min(frame.top + frame.height, vv.height) - top);
    const layoutHeight = zoomed ? frame.height : Math.max(0, Math.min(frame.height, vv.offsetTop + vv.height - frame.top));
    return {visible, layoutHeight, covered: frame.height - visible, inset: Math.max(0, Math.round(frame.height - layoutHeight)), zoomed};
}

function nearestScroller(el: HTMLElement): HTMLElement | null {
    let s: HTMLElement | null = el.parentElement;
    while (s && s !== document.body && s !== document.documentElement) {
        if (/(auto|scroll)/.test(getComputedStyle(s).overflowY)) return s;
        s = s.parentElement;
    }
    const root = scrollRoot();
    return root.contains(el) ? root : null;
}

/** A sticky / fixed bar at (x, y) that is not the field's own box. */
function barAt(x: number, y: number, field: HTMLElement): DOMRect | null {
    let hit = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!hit || field.contains(hit) || hit.contains(field)) return null;
    while (hit && !['sticky', 'fixed'].includes(getComputedStyle(hit).position)) hit = hit.parentElement;
    if (!hit || hit.contains(field) || hit.classList.contains('ds-shell-mic')) return null;
    return hit.getBoundingClientRect();
}

/** R2-4 (round 4): keep the focused field inside the part of its scroller the
 * keyboard, Safari's pan and pinned bars leave. A block marked
 * data-keyboard-reveal (a field with its own 確定 / 取消 row) is revealed
 * whole when it fits. No scrollIntoView: it can pan the visual viewport. */
export function revealField(focused: HTMLElement, vv: VisualViewport, smooth = false) {
    const block = focused.closest('[data-keyboard-reveal]') as HTMLElement | null;
    const scroller = nearestScroller(focused);
    if (!scroller) return;
    const box = scroller.getBoundingClientRect();
    let top = Math.max(vv.offsetTop, box.top) + 12;
    let bottom = Math.min(vv.offsetTop + vv.height, box.bottom) - 16;
    let field = block && block.getBoundingClientRect().height <= bottom - top ? block : focused;
    let r = field.getBoundingClientRect();
    const x = Math.min(Math.max(r.left + 8, box.left + 1), box.right - 1);
    const below = barAt(x, bottom + 12, field);
    if (below) bottom = Math.min(bottom, below.top - 12);
    const above = barAt(x, top - 8, field);
    if (above) top = Math.max(top, above.bottom + 12);
    if (field === block && r.height > bottom - top) { field = focused; r = field.getBoundingClientRect(); }
    let dy = 0;
    if (r.bottom > bottom) dy = r.bottom - bottom;
    if (r.top - dy < top) dy = r.top - top;
    if (Math.abs(dy) < 1) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    scroller.scrollBy({top: dy, behavior: smooth && !reduce ? 'smooth' : 'auto'});
}

/** See the file comment. Returns the cleanup. */
export function installTapFocus(): () => void {
    let press: {field: HTMLInputElement | HTMLTextAreaElement; id: number; x: number; y: number; at: number} | null = null;
    const fieldFor = (t: EventTarget | null) => {
        if (!(t instanceof Element)) return null;
        if (isTextEntry(t)) return t;
        if (t.closest('input, textarea, select, button, a, [contenteditable]')) return null;
        const control = t.closest('label')?.control ?? null;
        return isTextEntry(control) ? control : null;
    };
    const onStart = (e: TouchEvent) => {
        press = null;
        if (e.touches.length !== 1) return;
        const field = fieldFor(e.target);
        if (!field || field === document.activeElement || field.id === 'chat-input-box') return;
        const t = e.touches[0];
        press = {field, id: t.identifier, x: t.clientX, y: t.clientY, at: e.timeStamp};
    };
    const onMove = (e: TouchEvent) => {
        if (!press) return;
        const t = Array.from(e.touches).find(p => p.identifier === press?.id);
        if (!t || e.touches.length !== 1 || Math.hypot(t.clientX - press.x, t.clientY - press.y) > 8) press = null;
    };
    const onEnd = (e: TouchEvent) => {
        const p = press;
        press = null;
        if (!p || !e.cancelable || !p.field.isConnected) return;
        const t = Array.from(e.changedTouches).find(q => q.identifier === p.id);
        // Long press (selection, magnifier) stays native.
        if (!t || Math.hypot(t.clientX - p.x, t.clientY - p.y) > 8 || e.timeStamp - p.at > 450) return;
        e.preventDefault(); // no native tap: no caret reveal pan, no synthesized click
        const field = p.field;
        field.focus({preventScroll: true});
        // A first focus puts the caret after what is already written.
        try {
            if (field.selectionStart === 0 && field.selectionEnd === 0 && field.value) field.setSelectionRange(field.value.length, field.value.length);
        } catch { /* number fields have no selection */ }
    };
    const onCancel = () => { press = null; };
    document.addEventListener('touchstart', onStart, {capture: true, passive: true});
    document.addEventListener('touchmove', onMove, {capture: true, passive: true});
    document.addEventListener('touchend', onEnd, {capture: true, passive: false});
    document.addEventListener('touchcancel', onCancel, {capture: true, passive: true});
    return () => {
        document.removeEventListener('touchstart', onStart, true);
        document.removeEventListener('touchmove', onMove, true);
        document.removeEventListener('touchend', onEnd, true);
        document.removeEventListener('touchcancel', onCancel, true);
    };
}

/** Round 4: stand-in for React's autoFocus (which calls plain focus() and lets
 * Safari pan the page to the field as the keyboard rises). Use as a ref on a
 * field that should take focus as soon as it appears. */
export function focusOnMount(el: HTMLInputElement | HTMLTextAreaElement | null) {
    el?.focus({preventScroll: true});
}
