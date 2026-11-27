import {useState} from 'react';
import type {GlucoseViewModel} from './useGlucoseViewModel';
import {SaveSuccessBanner} from './sections/SaveSuccessBanner';
import {SymptomEntryForm} from './sections/SymptomEntryForm';
import {SymptomCloudPanel} from './sections/SymptomCloudPanel';
import {SymptomRecordList} from './sections/SymptomRecordList';
import {RecordEntryCard} from './sections/RecordEntryCard';
import {SubPage} from '../../components/shell/SubPage';

export function SymptomTab({vm}: {vm: GlucoseViewModel}) {
    // S4: the entry form is a sub-page (same shared draft, same save).
    const [entryOpen, setEntryOpen] = useState(false);
    return (
        <div className="ds-rec-tab">
            <SaveSuccessBanner vm={vm} syncHint="數據已即時同步到下方的數據看板及字雲中！" />
            <RecordEntryCard vm={vm} id="btn-rec-entry-symptom" icon="symptom" title="記錄症狀" timeLabel="紀錄時間" periodLabel="紀錄時段" onOpen={() => setEntryOpen(true)} />
            <SubPage open={entryOpen} title="記錄症狀" onBack={() => setEntryOpen(false)} className="ds-rec-entry-page">
                <SymptomEntryForm vm={vm} onSaved={() => setEntryOpen(false)} />
            </SubPage>
            <SymptomCloudPanel vm={vm} />
            <SymptomRecordList vm={vm} />
        </div>
    );
}
