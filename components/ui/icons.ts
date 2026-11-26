/**
 * Canonical line-icon map for later shell and page stages.
 * Icons stay lucide-react (no new dependency). Default stroke is a quiet
 * line, not a heavy fill. Decorative uses must set aria-hidden.
 *
 * Stage 3 bottom nav (labels stay full-length, 問 AI is the centre tab):
 *   home, glucose, consult, savedQuestions, profile
 */
import {
    ALargeSmall,
    Activity,
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    Bookmark,
    Building2,
    Calendar,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    Droplet,
    FileText,
    Heart,
    Home,
    Info,
    MessageCircle,
    Mic,
    MicOff,
    Pencil,
    Pill,
    Pointer,
    Plus,
    Send,
    Settings,
    ShieldCheck,
    Sparkles,
    Square,
    Sun,
    Trash2,
    User,
    Volume2,
    X,
} from 'lucide-react';

export const UI_ICON_DEFAULTS = {
    strokeWidth: 1.75,
    size: 22,
} as const;

export const uiIcons = {
    home: Home,
    glucose: Droplet,
    consult: MessageCircle,
    askAi: Sparkles,
    savedQuestions: FileText,
    savedBookmark: Bookmark,
    profile: User,
    mic: Mic,
    micStop: MicOff,
    add: Plus,
    close: X,
    back: ChevronLeft,
    forward: ChevronRight,
    expand: ChevronDown,
    check: Check,
    warning: AlertTriangle,
    info: Info,
    glucoseLow: ArrowDown,
    glucoseHigh: ArrowUp,
    medication: Pill,
    download: Download,
    trash: Trash2,
    edit: Pencil,
    calendar: Calendar,
    clock: Clock,
    clinic: Building2,
    support: Heart,
    settings: Settings,
    morning: Sun,
    activity: Activity,
    send: Send,
    speak: Volume2,
    stop: Square,
    fontSize: ALargeSmall,
    tapHint: Pointer,
    privacy: ShieldCheck,
} as const;

export type UiIconName = keyof typeof uiIcons;

export function getUiIcon(name: UiIconName) {
    return uiIcons[name];
}
