import {View} from '../../utils/types';
import {uiIcons} from '../../components/ui';
import type {HomeViewModel} from './useHomeViewModel';

export function AskAiButton({vm}: {vm: HomeViewModel}) {
    const {setView, setConsultStep} = vm;
    const ConsultIcon = uiIcons.consult;

    return (
        <button
            type="button"
            id="btn-home-ask-ai"
            data-verify="consult-open"
            className="ds-home-ask ds-control"
            onClick={() => {
                setView(View.Consult);
                setConsultStep('INPUT');
            }}
        >
            <span className="ds-home-ask-text">
                <span className="ds-home-ask-title">問問 AI</span>
                <span className="ds-home-ask-sub">整理疑問，準備覆診</span>
                <span className="ds-home-ask-go">開始提問 →</span>
            </span>
            <span className="ds-home-ask-art" aria-hidden>
                <span className="ds-home-ask-orb" />
                <ConsultIcon size={36} strokeWidth={1.6} />
            </span>
        </button>
    );
}
