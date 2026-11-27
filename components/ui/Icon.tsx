import {UI_ICON_DEFAULTS, uiIcons, type UiIconName} from './icons';

/** A decorative uiIcons glyph at the default stroke width (always aria-hidden). */
export function Icon({name, size = UI_ICON_DEFAULTS.size, className}: {name: UiIconName; size?: number; className?: string}) {
    const Glyph = uiIcons[name];
    return <Glyph size={size} strokeWidth={UI_ICON_DEFAULTS.strokeWidth} aria-hidden className={className} />;
}
