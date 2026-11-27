import {useState} from 'react';
import type {GlucoseViewModel} from './useGlucoseViewModel';
import {SaveSuccessBanner} from './sections/SaveSuccessBanner';
import {GlucoseEntryForm} from './sections/GlucoseEntryForm';
import {GlucoseStatsPanel} from './sections/GlucoseStatsPanel';
import {GlucoseTrendChart} from './sections/GlucoseTrendChart';
import {GlucoseRecordList} from './sections/GlucoseRecordList';
import {RecordEntryCard, draftLines} from './sections/RecordEntryCard';
import {SubPage} from '../../components/shell/SubPage';
import {Icon} from '../../components/ui';

export function BloodGlucoseTab({vm}: {vm: GlucoseViewModel}) {
    // S4: the entry form is a sub-page (same shared draft, same save).
    const [entryOpen, setEntryOpen] = useState(false);
    const empty = vm.glucoseRecords.length === 0;
    return (
        <div className={`ds-rec-tab${empty ? ' is-empty' : ''}`}>
            <SaveSuccessBanner vm={vm} syncHint="數據已即時同步到下方的數據看板及走勢圖中！" />
            {empty && (
                <div className="ds-rec-quiet">
                    <span className="ds-rec-quiet-mark" aria-hidden>
                        <Icon name="glucose" />
                    </span>
                    <p className="ds-rec-quiet-title">還沒有血糖紀錄</p>
                </div>
            )}
            <RecordEntryCard id="btn-rec-entry-bg" icon="glucose" title={empty ? '+ 記錄血糖' : '記錄血糖'} lines={draftLines(vm, "測量時間", "測量時段")} onOpen={() => setEntryOpen(true)} />
            <SubPage open={entryOpen} title="記錄血糖" onBack={() => setEntryOpen(false)} className="ds-rec-entry-page">
                <GlucoseEntryForm vm={vm} onSaved={() => setEntryOpen(false)} />
            </SubPage>
            {!empty && <GlucoseStatsPanel vm={vm} />}
            {!empty && <GlucoseTrendChart vm={vm} />}
            {!empty && <GlucoseRecordList vm={vm} />}
        </div>
    );
}
