import type {GlucoseViewModel} from './useGlucoseViewModel';
import {SaveSuccessBanner} from './sections/SaveSuccessBanner';
import {SymptomEntryForm} from './sections/SymptomEntryForm';
import {SymptomCloudPanel} from './sections/SymptomCloudPanel';
import {SymptomRecordList} from './sections/SymptomRecordList';

export function SymptomTab({vm}: {vm: GlucoseViewModel}) {
    return (
                <div className="space-y-6 animate-soft">
                    <SaveSuccessBanner vm={vm} syncHint="數據已即時同步到下方的數據看板及字雲中！" />
                    <SymptomEntryForm vm={vm} />
                    <SymptomCloudPanel vm={vm} />
                    <SymptomRecordList vm={vm} />
                </div>
    );
}
