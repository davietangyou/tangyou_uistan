import {uiIcons} from './ui/icons';

export function FocusToast() {
    const HintIcon = uiIcons.tapHint;
    return (
        <div className="ds-root ds-shell-toast" role="status" aria-live="polite">
            <HintIcon size={24} strokeWidth={2} aria-hidden />
            <span className="t-label">請先點擊一下您想要輸入的空格</span>
        </div>
    );
}
