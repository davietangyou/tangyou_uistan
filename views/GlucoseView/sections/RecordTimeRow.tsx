import type {GlucoseViewModel} from '../useGlucoseViewModel';
import {BottomSheet, Button, Icon} from '../../../components/ui';

/** 測量時間 / 紀錄時間 row: label + live/backfill status, full-width time button, native datetime picker. */
export function RecordTimeRow({vm, label}: {vm: GlucoseViewModel; label: string}) {
    const {formattedTime, handleSetTime, isLiveTime, isTimePickerOpen, setIsTimePickerOpen} = vm;

    return (
        <div className="ds-rec-row">
            <div className="ds-rec-row-head">
                <span className="t-label">{label}</span>
                {isLiveTime ? (
                    <span className="ds-rec-pill is-normal">即時</span>
                ) : (
                    <span className="ds-rec-pill is-caution">補選時間</span>
                )}
            </div>
            <button
                type="button"
                onClick={() => setIsTimePickerOpen(!isTimePickerOpen)}
                aria-expanded={isTimePickerOpen}
                className="ds-rec-picker ds-control"
            >
                <Icon name="clock" />
                <span className="ds-rec-picker-text">{formattedTime.zh}</span>
                <Icon name="expand" className={`ds-rec-chevron${isTimePickerOpen ? ' is-open' : ''}`} />
            </button>

            {/* S4: picked in a bottom sheet; changes apply as before (immediately), 完成 just closes. */}
            <BottomSheet
                open={isTimePickerOpen}
                onClose={() => setIsTimePickerOpen(false)}
                title={label}
                hideClose
                footer={<Button onClick={() => setIsTimePickerOpen(false)}>完成</Button>}
            >
                <div className="ds-rec-panel ds-rec-time-sheet">
                    <input
                        type="datetime-local"
                        aria-label={label}
                        value={formattedTime.isoForPicker}
                        onChange={(e) => {
                            if (e.target.value) {
                                handleSetTime(new Date(e.target.value), false);
                            }
                        }}
                        className="ds-field-control ds-control"
                    />
                    <button
                        type="button"
                        onClick={() => {
                            handleSetTime(new Date(), true);
                            setIsTimePickerOpen(false);
                        }}
                        className={`ds-btn ds-control ${isLiveTime ? 'ds-btn-primary' : 'ds-btn-secondary'}`}
                    >
                        設為現在時間
                    </button>
                </div>
            </BottomSheet>
        </div>
    );
}
