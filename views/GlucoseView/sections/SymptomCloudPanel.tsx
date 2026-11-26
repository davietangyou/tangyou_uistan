import type {GlucoseViewModel} from '../useGlucoseViewModel';
import {CustomRangePanel, EmptyState, RangeSwitch} from './recordUi';
import {Icon} from '../../../components/ui';

export function SymptomCloudPanel({vm}: {vm: GlucoseViewModel}) {
    const {
        selectedSymptomFilter,
        setIsSymptomRecentRecordsVisible,
        setSelectedSymptomFilter,
        setSymptomCustomEndDate,
        setSymptomCustomPresetDays,
        setSymptomCustomPresetThisMonth,
        setSymptomCustomStartDate,
        setSymptomRange,
        symptomCustomEndDate,
        symptomCustomStartDate,
        symptomRange,
        symptomRangeTimeBounds,
        symptomStats
    } = vm;

    return (
        <section className="ds-rec-section" aria-labelledby="symptom-cloud-title">
            <div className="ds-rec-section-head">
                <h2 id="symptom-cloud-title" className="t-h2">症狀視覺字雲與統計</h2>
                <p className="t-caption t-ink-2">
                    當前統計區間：<strong>{symptomRangeTimeBounds.label}</strong> ({symptomRangeTimeBounds.description})
                </p>
            </div>

            <RangeSwitch name="symptom-range" value={symptomRange} onChange={setSymptomRange} label="症狀統計時間範圍" />

            {symptomRange === 'CUSTOM' && (
                <CustomRangePanel
                    start={symptomCustomStartDate}
                    end={symptomCustomEndDate}
                    onStart={setSymptomCustomStartDate}
                    onEnd={setSymptomCustomEndDate}
                    presets={[
                        { label: '近 3 天', onClick: () => setSymptomCustomPresetDays(3) },
                        { label: '近 14 天', onClick: () => setSymptomCustomPresetDays(14) },
                        { label: '近 30 天', onClick: () => setSymptomCustomPresetDays(30) },
                        { label: '本月', onClick: () => setSymptomCustomPresetThisMonth() }
                    ]}
                />
            )}

            {/* 症狀分類統計 */}
            <div className="ds-rec-cats">
                <div className="ds-rec-cat is-low">
                    <p className="t-label">低血糖相關症狀</p>
                    <p className="ds-rec-value"><span className="t-h1">{symptomStats.categorySummary.lowBgCount}</span><span className="ds-rec-unit">次</span></p>
                    <p className="t-caption">冷汗、心悸手震、頭暈、飢餓</p>
                </div>
                <div className="ds-rec-cat is-high">
                    <p className="t-label">高血糖滲透症狀</p>
                    <p className="ds-rec-value"><span className="t-h1">{symptomStats.categorySummary.highBgCount}</span><span className="ds-rec-unit">次</span></p>
                    <p className="t-caption">口乾口渴、頻尿、極度疲倦</p>
                </div>
                <div className="ds-rec-cat is-nerve">
                    <p className="t-label">神經/微血管警示</p>
                    <p className="ds-rec-value"><span className="t-h1">{symptomStats.categorySummary.complicationCount}</span><span className="ds-rec-unit">次</span></p>
                    <p className="t-caption">手腳發麻、視力模糊</p>
                </div>
                <div className="ds-rec-cat is-top">
                    <p className="t-label">最常出現症狀</p>
                    {symptomStats.recordedList.length > 0 ? (
                        <>
                            <p className="t-title">{symptomStats.recordedList[0].name}</p>
                            <p className="t-caption">
                                累計 {symptomStats.recordedList[0].count} 次 ({symptomStats.recordedList[0].percentage}%)
                            </p>
                        </>
                    ) : (
                        <p className="t-caption">此區間暫無紀錄</p>
                    )}
                </div>
            </div>

            {symptomStats.totalRecordsWithSymptom === 0 ? (
                <EmptyState>
                    <p className="t-body-strong t-ink-2">在「{symptomRangeTimeBounds.label}」內暫無症狀數據</p>
                    <p className="t-caption t-ink-2">
                        您可切換上方時間範圍（如切換至「月」、「年」或自定義日期），或在上方登記新的症狀紀錄！
                    </p>
                </EmptyState>
            ) : (
                <div className="ds-rec-cloud-wrap">
                    {selectedSymptomFilter && (
                        <div className="ds-rec-filterbar" role="status">
                            <Icon name="filter" />
                            <span className="t-body-strong">正在查看「{selectedSymptomFilter}」的歷史紀錄</span>
                            <button
                                type="button"
                                onClick={() => setSelectedSymptomFilter(null)}
                                className="ds-btn ds-btn-secondary ds-control"
                            >
                                <Icon name="close" />
                                <span>清除篩選</span>
                            </button>
                        </div>
                    )}

                    {/* 字雲：大小代表次數，次數一律以文字寫出 */}
                    <div className="ds-rec-cloud">
                        {symptomStats.list.map((s) => {
                            if (s.count === 0) {
                                return (
                                    <span
                                        key={s.name}
                                        className="ds-rec-word is-zero"
                                        title="此區間未曾記錄此症狀"
                                    >
                                        {s.name}
                                    </span>
                                );
                            }

                            // 計算相對權重大小（與原分級相同：≥0.8 / ≥0.5 / ≥0.25）
                            const ratio = s.count / symptomStats.maxCount;
                            let tier = 'is-t1';
                            if (ratio >= 0.8) {
                                tier = 'is-t4';
                            } else if (ratio >= 0.5) {
                                tier = 'is-t3';
                            } else if (ratio >= 0.25) {
                                tier = 'is-t2';
                            }

                            const isFiltered = selectedSymptomFilter === s.name;

                            return (
                                <button
                                    key={s.name}
                                    type="button"
                                    onClick={() => {
                                        if (isFiltered) {
                                            setSelectedSymptomFilter(null);
                                        } else {
                                            setSelectedSymptomFilter(s.name);
                                            setIsSymptomRecentRecordsVisible(true);
                                        }
                                    }}
                                    aria-pressed={isFiltered}
                                    className={`ds-rec-word ds-control ${tier}`}
                                    title={`點擊篩選「${s.name}」紀錄，累計 ${s.count} 次`}
                                >
                                    <span>{s.name}</span>
                                    <span className="ds-rec-count">{s.count}次</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}
