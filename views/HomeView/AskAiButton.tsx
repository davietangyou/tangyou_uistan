import {View} from '../../utils/types';
import type {HomeViewModel} from './useHomeViewModel';

export function AskAiButton({vm}: {vm: HomeViewModel}) {
    const {setView, setConsultStep} = vm;

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
        </button>
    );
}
