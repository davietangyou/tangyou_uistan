import type {GlucoseViewModel} from '../useGlucoseViewModel';
import {RecordCard} from './RecordCard';
import {withDayHeaders} from './RecordDays';
import {DisclosureButton, EmptyState} from './recordUi';
import {confirmThen, Icon} from '../../../components/ui';

export function GlucoseRecordList({vm}: {vm: GlucoseViewModel}) {
    const {
        abnormalRecordsCount,
        filteredRecentRecords,
        glucoseRecords,
        isRecentRecordsVisible,
        isRecordsExpanded,
        recordFilter,
        setGlucoseRecords,
        setIsRecentRecordsVisible,
        setIsRecordsExpanded,
        setRecordFilter,
        visibleRecords
    } = vm;

    return (
        <section className="ds-rec-section" aria-labelledby="glucose-records-title">
            <div className="ds-rec-section-head">
                <h2 id="glucose-records-title" className="t-h2">最近紀錄報告</h2>
                <p className="t-caption t-ink-2">(共 {glucoseRecords.length} 筆)</p>
            </div>
            <DisclosureButton verify="rec-expand-glucose" expanded={isRecentRecordsVisible} onClick={() => setIsRecentRecordsVisible(!isRecentRecordsVisible)}>
                {isRecentRecordsVisible ? '收起隱藏' : '展開顯示'}
            </DisclosureButton>

            {isRecentRecordsVisible && (
                <div className="ds-cluster ds-rec-filters" role="group" aria-label="篩選紀錄">
                    <button
                        type="button"
                        onClick={() => {
                            setRecordFilter('ALL');
                            setIsRecordsExpanded(false);
                        }}
                        aria-pressed={recordFilter === 'ALL'}
                        className="ds-chip ds-control ds-rec-filter"
                    >
                        全部 ({glucoseRecords.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setRecordFilter('ABNORMAL');
                            setIsRecordsExpanded(false);
                        }}
                        aria-pressed={recordFilter === 'ABNORMAL'}
                        className="ds-chip ds-control ds-rec-filter"
                    >
                        <span>僅看異常</span>
                        {abnormalRecordsCount > 0 && (
                            <span className="ds-rec-count">{abnormalRecordsCount}</span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setRecordFilter('NORMAL');
                            setIsRecordsExpanded(false);
                        }}
                        aria-pressed={recordFilter === 'NORMAL'}
                        className="ds-chip ds-control ds-rec-filter"
                    >
                        僅看正常
                    </button>
                </div>
            )}

            {isRecentRecordsVisible && (
                visibleRecords.length > 0 ? (
                    <div className="ds-rec-list">
                        {withDayHeaders(visibleRecords, r => (
                            <RecordCard
                                key={r.id}
                                record={r}
                                showDetails
                                onDelete={() => confirmThen('刪除這筆血糖紀錄？', '刪除後無法復原。', '刪除', () => setGlucoseRecords(glucoseRecords.filter(rec => rec.id !== r.id)))}
                            />
                        ))}

                        {filteredRecentRecords.length > 6 && (
                            <button
                                type="button"
                                onClick={() => setIsRecordsExpanded(!isRecordsExpanded)}
                                aria-expanded={isRecordsExpanded}
                                className="ds-btn ds-btn-secondary ds-btn-block ds-control ds-rec-more"
                            >
                                <Icon name="expand" className={`ds-rec-chevron${isRecordsExpanded ? ' is-open' : ''}`} />
                                {isRecordsExpanded ? (
                                    <span>收起記錄（僅看最近 6 筆）</span>
                                ) : (
                                    <span>展開更多紀錄（共 {filteredRecentRecords.length} 筆，還有 {filteredRecentRecords.length - 6} 筆）</span>
                                )}
                            </button>
                        )}
                    </div>
                ) : (
                    <EmptyState
                        action={recordFilter !== 'ALL' ? (
                            <button type="button" onClick={() => setRecordFilter('ALL')} className="ds-btn ds-btn-secondary ds-control">
                                查看全部紀錄
                            </button>
                        ) : undefined}
                    >
                        <p className="t-body-strong t-ink-2">
                            {recordFilter === 'ABNORMAL' ? '無異常數值記錄，血糖控制得非常平穩！' : '暫無相關記錄'}
                        </p>
                    </EmptyState>
                )
            )}
        </section>
    );
}
