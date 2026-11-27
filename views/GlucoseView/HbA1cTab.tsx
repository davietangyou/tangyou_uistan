import {useState} from 'react';
import type {GlucoseViewModel} from './useGlucoseViewModel';
import {HbA1cEntryForm} from './sections/HbA1cEntryForm';
import {HbA1cTrendChart} from './sections/HbA1cTrendChart';
import {HbA1cRecordList} from './sections/HbA1cRecordList';
import {RecordEntryCard} from './sections/RecordEntryCard';
import {SubPage} from '../../components/shell/SubPage';
import {Icon} from '../../components/ui';

export function HbA1cTab({vm}: {vm: GlucoseViewModel}) {
    // S5 (owner t20u): entry as a sub-page, like 血糖 / 症狀 (same draft, same save).
    const [entryOpen, setEntryOpen] = useState(false);
    const empty = vm.hba1cRecords.length === 0;
    return (
        <div className={`ds-rec-tab${empty ? ' is-empty' : ''}`}>
            {empty && (
                <div className="ds-rec-quiet">
                    <span className="ds-rec-quiet-mark" aria-hidden>
                        <Icon name="chart" />
                    </span>
                    <p className="ds-rec-quiet-title">還沒有糖化紀錄</p>
                </div>
            )}
            <RecordEntryCard id="btn-rec-entry-hba1c" icon="chart" title={empty ? '+ 記錄糖化' : '記錄糖化血紅素'} lines={[{label: '檢查/抽血日期', value: vm.newHbA1c.date}]} onOpen={() => setEntryOpen(true)} />
            <SubPage open={entryOpen} title={<>記錄<wbr />糖化血紅素</>} onBack={() => setEntryOpen(false)} className="ds-rec-entry-page">
                <HbA1cEntryForm vm={vm} onSaved={() => setEntryOpen(false)} />
            </SubPage>
            {!empty && <HbA1cTrendChart vm={vm} />}
            {!empty && <HbA1cRecordList vm={vm} />}
        </div>
    );
}
