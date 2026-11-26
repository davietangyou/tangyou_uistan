import { applyFrozenClock } from './clock.mjs';
import { disableAnimations } from './page.mjs';

export async function prepareVerifyCdp(cdp, { width = 430, height = 900, deviceScaleFactor = 1 } = {}) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor,
        mobile: false,
    });
    await applyFrozenClock(cdp);
    // Animations can still be disabled after load; the clock must be installed
    // before the first navigation so Date is frozen on every document.
    return { width, height };
}

export { disableAnimations };
