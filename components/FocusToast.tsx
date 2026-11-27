import {Toast} from './ui/Toast';
import {uiIcons} from './ui/icons';

export function FocusToast() {
    const HintIcon = uiIcons.tapHint;
    return (
        <Toast tone="info" icon={<HintIcon size={24} strokeWidth={2} aria-hidden />} className="ds-shell-toast">
            <span className="t-label">請先點擊一下您想要輸入的空格</span>
        </Toast>
    );
}
