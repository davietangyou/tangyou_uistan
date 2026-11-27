import type {GlucoseViewModel} from '../useGlucoseViewModel';
import {Icon, type UiIconName} from '../../../components/ui';

/**
 * S4: the page's way into an entry sub-page (記錄血糖 / 記錄症狀). It also
 * shows where the next record will land — the live (or back-filled) time and
 * the current 時段 of the shared draft — so nothing about the draft is hidden
 * behind the extra tap.
 */
export function RecordEntryCard({vm, id, title, timeLabel, periodLabel, icon, onOpen}: {
    vm: GlucoseViewModel;
    id: string;
    title: string;
    timeLabel: string;
    periodLabel: string;
    icon: UiIconName;
    onOpen: () => void;
}) {
    const {formattedTime, currentPeriodInfo, isLiveTime} = vm;
    return (
        <button type="button" id={id} className="ds-rec-entry ds-control" onClick={onOpen} aria-haspopup="dialog">
            <span className="ds-rec-entry-head">
                <span className="ds-rec-entry-mark" aria-hidden><Icon name={icon} /></span>
                <span className="ds-rec-entry-title">{title}</span>
                <span className="ds-rec-entry-go" aria-hidden><Icon name="add" /></span>
            </span>
            <span className="ds-rec-entry-meta">
                <span className="ds-rec-entry-line">
                    <span className="t-caption">{timeLabel}</span>
                    <span className="t-body-strong">{formattedTime.zh}{isLiveTime ? '' : '（補選時間）'}</span>
                </span>
                <span className="ds-rec-entry-line">
                    <span className="t-caption">{periodLabel}</span>
                    <span className="t-body-strong">{currentPeriodInfo.label}</span>
                </span>
            </span>
        </button>
    );
}
