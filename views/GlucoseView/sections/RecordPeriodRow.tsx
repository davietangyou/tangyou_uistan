import type {GlucoseViewModel} from '../useGlucoseViewModel';
import { PERIOD_OPTIONS } from '../constants';
import {BottomSheet, Icon} from '../../../components/ui';

/** 測量時段 / 紀錄時段 row. Selection logic unchanged (timeType + mealTag match). */
export function RecordPeriodRow({vm, label}: {vm: GlucoseViewModel; label: string}) {
    const {currentPeriodInfo, handleSelectPeriod, isPeriodPickerOpen, newGlucose, setIsPeriodPickerOpen} = vm;

    return (
        <div className="ds-rec-row">
            <div className="ds-rec-row-head">
                <span className="t-label">{label}</span>
            </div>
            <button
                type="button"
                onClick={() => setIsPeriodPickerOpen(!isPeriodPickerOpen)}
                aria-haspopup="dialog"
                aria-expanded={isPeriodPickerOpen}
                className="ds-rec-picker ds-control"
            >
                <Icon name="calendar" />
                <span className="ds-rec-picker-text">{currentPeriodInfo.label}</span>
                <Icon name="expand" className={`ds-rec-chevron${isPeriodPickerOpen ? ' is-open' : ''}`} />
            </button>

            {/* S4: choosing happens in a bottom sheet; a tap selects and closes (handleSelectPeriod, unchanged). */}
            <BottomSheet
                open={isPeriodPickerOpen}
                onClose={() => setIsPeriodPickerOpen(false)}
                title={label}
            >
                <div className="ds-rec-panel ds-rec-options">
                    {PERIOD_OPTIONS.map((item) => {
                        const isSelected =
                            (item.mealTag
                                ? newGlucose.timeType === item.timeType && newGlucose.mealTag === item.mealTag
                                : newGlucose.timeType === item.timeType);
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelectPeriod(item)}
                                aria-pressed={isSelected}
                                className="ds-rec-option ds-control"
                            >
                                <span>{item.label}</span>
                                {isSelected && <Icon name="check" />}
                            </button>
                        );
                    })}
                </div>
            </BottomSheet>
        </div>
    );
}
