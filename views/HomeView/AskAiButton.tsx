import {View} from '../../utils/types';
import {UI_ICON_DEFAULTS, uiIcons} from '../../components/ui';
import type {HomeViewModel} from './useHomeViewModel';

export function AskAiButton({vm}: {vm: HomeViewModel}) {
    const {setView, setConsultStep} = vm;
    const ConsultIcon = uiIcons.consult;
    const Chevron = uiIcons.forward;

    return (
        <button
            type="button"
            id="btn-home-ask-ai"
            className="ds-home-ask ds-control"
            onClick={() => {
                setView(View.Consult);
                setConsultStep('INPUT');
            }}
        >
            <span className="ds-home-ask-icon" aria-hidden>
                <ConsultIcon size={28} strokeWidth={2} />
            </span>
            <span className="ds-home-ask-text">
                <span className="ds-home-ask-title">問問 AI</span>
            </span>
            <span className="ds-home-ask-chevron" aria-hidden>
                <Chevron size={UI_ICON_DEFAULTS.size} strokeWidth={UI_ICON_DEFAULTS.strokeWidth} />
            </span>
        </button>
    );
}
