import type {GlucoseViewModel} from '../useGlucoseViewModel';
import {hba1cRecordTier} from '../recordStatus';
import {DeleteRecordButton, DisclosureButton, EmptyState, StatusPill} from './recordUi';
import {confirmThen} from '../../../components/ui';

const TIER = {
    high: {tone: 'low', text: '控制不理想'},
    elevated: {tone: 'high', text: '偏高 需注意'},
    ideal: {tone: 'normal', text: '控制理想'},
} as const;

export function HbA1cRecordList({vm}: {vm: GlucoseViewModel}) {
    const {hba1cRecords, isHba1cRecentRecordsVisible, setHba1cRecords, setIsHba1cRecentRecordsVisible} = vm;

    return (
        <section className="ds-rec-section" aria-labelledby="hba1c-records-title">
            <div className="ds-rec-section-head">
                <h2 id="hba1c-records-title" className="t-h2">最近 HbA1c 紀錄報告</h2>
                <p className="t-caption t-ink-2">(共 {hba1cRecords.length} 筆)</p>
            </div>
            <DisclosureButton expanded={isHba1cRecentRecordsVisible} onClick={() => setIsHba1cRecentRecordsVisible(!isHba1cRecentRecordsVisible)}>
                {isHba1cRecentRecordsVisible ? '收起隱藏' : '展開顯示'}
            </DisclosureButton>

            {isHba1cRecentRecordsVisible && (
                hba1cRecords.length === 0 ? (
                    <EmptyState>
                        <p className="t-body-strong t-ink-2">暫無歷史 HbA1c 紀錄數據</p>
                    </EmptyState>
                ) : (
                    <div className="ds-rec-list">
                        {hba1cRecords.map(r => {
                            const t = TIER[hba1cRecordTier(r.value)];
                            return (
                                <article key={r.id} className={`ds-card ds-rec-card is-${t.tone}`}>
                                    <div className="ds-rec-card-main">
                                        <div className="ds-rec-card-top">
                                            <p className="ds-rec-value"><span className="t-h1">{r.value}</span><span className="ds-rec-unit">%</span></p>
                                            <StatusPill tone={t.tone}>{t.text}</StatusPill>
                                        </div>
                                        <p className="t-caption t-ink-2">檢查日期: {r.date}</p>
                                    </div>
                                    <DeleteRecordButton onClick={() => confirmThen('刪除這筆糖化血色素紀錄？', '刪除後無法復原。', '刪除', () => setHba1cRecords(hba1cRecords.filter(rec => rec.id !== r.id)))} />
                                </article>
                            );
                        })}
                    </div>
                )
            )}
        </section>
    );
}
