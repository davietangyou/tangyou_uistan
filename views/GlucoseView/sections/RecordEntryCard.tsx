import {Icon, type UiIconName} from '../../../components/ui';

/**
 * S4: the page's way into an entry sub-page (記錄血糖 / 記錄症狀 / 記錄糖化血紅素).
 * It also shows where the next record will land (the draft's time + 時段, or
 * the HbA1c test date), so nothing about the draft is hidden behind the tap.
 */
export function RecordEntryCard({id, title, icon, lines, onOpen}: {
    id: string;
    title: string;
    icon: UiIconName;
    lines: ReadonlyArray<{label: string; value: string}>;
    onOpen: () => void;
}) {
    return (
        <button type="button" id={id} data-verify={`rec-open-${id.replace(/^btn-rec-entry-/, '')}`} className="ds-rec-entry ds-control" onClick={onOpen} aria-haspopup="dialog">
            <span className="ds-rec-entry-head">
                <span className="ds-rec-entry-mark" aria-hidden><Icon name={icon} /></span>
                <span className="ds-rec-entry-title">{title}</span>
                <span className="ds-rec-entry-go" aria-hidden><Icon name="add" /></span>
            </span>
            <span className="ds-rec-entry-meta">
                {lines.map((l) => (
                    <span key={l.label} className="ds-rec-entry-line">
                        <span className="t-caption">{l.label}</span>
                        <span className="t-body-strong">{l.value}</span>
                    </span>
                ))}
            </span>
        </button>
    );
}

/** Lines for the glucose / symptom card: the shared draft's time and 時段. */
export function draftLines(vm: {formattedTime: {zh: string}; isLiveTime: boolean; currentPeriodInfo: {label: string}}, timeLabel: string, periodLabel: string) {
    return [
        {label: timeLabel, value: `${vm.formattedTime.zh}${vm.isLiveTime ? '' : '（補選時間）'}`},
        {label: periodLabel, value: vm.currentPeriodInfo.label},
    ];
}
