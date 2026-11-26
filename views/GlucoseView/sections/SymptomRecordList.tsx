import type {GlucoseViewModel} from '../useGlucoseViewModel';
import {RecordCard} from './RecordCard';
import {DisclosureButton, EmptyState} from './recordUi';
import {Icon} from '../../../components/ui';

export function SymptomRecordList({vm}: {vm: GlucoseViewModel}) {
    const {
        filteredSymptomGlucoseRecords,
        glucoseRecords,
        isSymptomRecentRecordsVisible,
        selectedSymptomFilter,
        setGlucoseRecords,
        setIsSymptomRecentRecordsVisible,
        setSelectedSymptomFilter,
        symptomRangeTimeBounds
    } = vm;

    const baseList = filteredSymptomGlucoseRecords;
    const filteredRecords = selectedSymptomFilter
        ? baseList.filter(r => r.symptoms && r.symptoms.includes(selectedSymptomFilter))
        : baseList;

    return (
        <section className="ds-rec-section" aria-labelledby="symptom-records-title">
            <div className="ds-rec-section-head">
                <h2 id="symptom-records-title" className="t-h2">
                    {selectedSymptomFilter
                        ? `已篩選症狀：「${selectedSymptomFilter}」的歷史紀錄`
                        : `最近紀錄報告`}
                </h2>
                <p className="t-caption t-ink-2">
                    ({symptomRangeTimeBounds.label} • 共 {filteredSymptomGlucoseRecords.length} 筆)
                </p>
            </div>
            <DisclosureButton expanded={isSymptomRecentRecordsVisible} onClick={() => setIsSymptomRecentRecordsVisible(!isSymptomRecentRecordsVisible)}>
                {isSymptomRecentRecordsVisible ? '收起詳細紀錄' : '下拉查看詳細紀錄'}
            </DisclosureButton>
            {selectedSymptomFilter && (
                <button
                    type="button"
                    onClick={() => setSelectedSymptomFilter(null)}
                    className="ds-btn ds-btn-ghost ds-control ds-rec-clear"
                >
                    <Icon name="close" />
                    <span>清除症狀篩選</span>
                </button>
            )}

            {isSymptomRecentRecordsVisible ? (
                filteredRecords.length === 0 ? (
                    <EmptyState
                        action={selectedSymptomFilter ? (
                            <button type="button" onClick={() => setSelectedSymptomFilter(null)} className="ds-btn ds-btn-secondary ds-control">
                                查看該時段全部紀錄
                            </button>
                        ) : undefined}
                    >
                        <p className="t-body-strong t-ink-2">
                            {selectedSymptomFilter
                                ? `在「${symptomRangeTimeBounds.label}」內查無與「${selectedSymptomFilter}」相關的紀錄`
                                : `在「${symptomRangeTimeBounds.label}」內暫無歷史紀錄`}
                        </p>
                    </EmptyState>
                ) : (
                    <div className="ds-rec-list">
                        {filteredRecords.map(r => (
                            <RecordCard
                                key={r.id}
                                record={r}
                                showDetails={false}
                                onDelete={() => setGlucoseRecords(glucoseRecords.filter(rec => rec.id !== r.id))}
                            />
                        ))}
                    </div>
                )
            ) : (
                <p className="t-caption t-ink-2">預設收起詳細紀錄，點擊上方按鈕即可展開查看 <strong>{symptomRangeTimeBounds.label}</strong> 的詳細測量與症狀紀錄 (共 {filteredSymptomGlucoseRecords.length} 筆)</p>
            )}
        </section>
    );
}
