import {useState} from 'react';
import type {GlucoseViewModel} from './useGlucoseViewModel';
import {HbA1cEntryForm} from './sections/HbA1cEntryForm';
import {HbA1cTrendChart} from './sections/HbA1cTrendChart';
import {HbA1cRecordList} from './sections/HbA1cRecordList';
import {RecordEntryCard} from './sections/RecordEntryCard';
import {SubPage} from '../../components/shell/SubPage';

export function HbA1cTab({vm}: {vm: GlucoseViewModel}) {
    // S5 (owner t20u): entry as a sub-page, like 血糖 / 症狀 (same draft, same save).
    const [entryOpen, setEntryOpen] = useState(false);
    return (
        <div className="ds-rec-tab">
            <RecordEntryCard id="btn-rec-entry-hba1c" icon="chart" title="記錄糖化血紅素" lines={[{label: '檢查/抽血日期', value: vm.newHbA1c.date}]} onOpen={() => setEntryOpen(true)} />
            <SubPage open={entryOpen} title={<>記錄<wbr />糖化血紅素</>} onBack={() => setEntryOpen(false)} className="ds-rec-entry-page">
                <HbA1cEntryForm vm={vm} onSaved={() => setEntryOpen(false)} />
            </SubPage>
            <HbA1cTrendChart vm={vm} />
            <HbA1cRecordList vm={vm} />
        </div>
    );
}
