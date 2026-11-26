/**
 * Frozen clock and Hong Kong timezone for deterministic verify captures.
 *
 * Headless Chrome otherwise runs in UTC, so greetings (早安/午安/晚安) and
 * the glucose "测量时段" default (which depends on getHours()) drift.
 * Every CDP session used by the harness must call applyFrozenClock()
 * after attach and before the first navigation.
 */
export const VERIFY_TIMEZONE = 'Asia/Hong_Kong';
export const VERIFY_LOCALE = 'zh-HK';

/** Thursday 26 Nov 2026, 09:30 HKT. Greeting = 早安; default period = 早餐後 2 小時. */
export const VERIFY_NOW_ISO = '2026-11-26T09:30:00+08:00';
export const VERIFY_NOW_MS = Date.parse(VERIFY_NOW_ISO);

export const VERIFY_EXPECTED = {
    dayPart: '早安',
    greetingWithName: '陳生，早安',
    greetingFallback: '老友記，早安',
    periodLabel: '早餐後 2 小時',
    periodTimeType: '餐後2小時',
    periodMealTag: '早餐',
    periodIcon: '🍞',
    weekdayZh: '週四',
};

export function frozenClockScript(nowMs = VERIFY_NOW_MS) {
    return `(() => {
        if (window.__verifyClockPatched) return;
        window.__verifyClockPatched = true;
        const FIXED = ${Number(nowMs)};
        const NativeDate = Date;
        function FrozenDate(...args) {
            if (!new.target) {
                return new NativeDate(FIXED).toString();
            }
            const inner = args.length === 0 ? new NativeDate(FIXED) : new NativeDate(...args);
            Object.setPrototypeOf(inner, FrozenDate.prototype);
            return inner;
        }
        FrozenDate.prototype = Object.create(NativeDate.prototype);
        Object.defineProperty(FrozenDate.prototype, 'constructor', { value: FrozenDate, writable: true, configurable: true });
        FrozenDate.now = function now() { return FIXED; };
        FrozenDate.parse = NativeDate.parse.bind(NativeDate);
        FrozenDate.UTC = NativeDate.UTC.bind(NativeDate);
        Object.setPrototypeOf(FrozenDate, NativeDate);
        window.Date = FrozenDate;
    })();`;
}

export async function applyFrozenClock(cdp, { nowMs = VERIFY_NOW_MS } = {}) {
    await cdp.send('Emulation.setTimezoneOverride', { timezoneId: VERIFY_TIMEZONE });
    await cdp.send('Emulation.setLocaleOverride', { locale: VERIFY_LOCALE }).catch(() => {});
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: frozenClockScript(nowMs) });
}
