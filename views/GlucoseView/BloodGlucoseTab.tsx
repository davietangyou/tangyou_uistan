import type {GlucoseViewModel} from './useGlucoseViewModel';
import {SaveSuccessBanner} from './sections/SaveSuccessBanner';
import {GlucoseEntryForm} from './sections/GlucoseEntryForm';
import {GlucoseStatsPanel} from './sections/GlucoseStatsPanel';
import {GlucoseTrendChart} from './sections/GlucoseTrendChart';
import {GlucoseRecordList} from './sections/GlucoseRecordList';

export function BloodGlucoseTab({vm}: {vm: GlucoseViewModel}) {
    return (
        <div className="ds-rec-tab">
            <SaveSuccessBanner vm={vm} syncHint="數據已即時同步到下方的數據看板及走勢圖中！" />
            <GlucoseEntryForm vm={vm} />
            <GlucoseStatsPanel vm={vm} />
            <GlucoseTrendChart vm={vm} />
            <GlucoseRecordList vm={vm} />
        </div>
    );
}
