import type {GlucoseViewModel} from './useGlucoseViewModel';
import {HbA1cEntryForm} from './sections/HbA1cEntryForm';
import {HbA1cTrendChart} from './sections/HbA1cTrendChart';
import {HbA1cRecordList} from './sections/HbA1cRecordList';

export function HbA1cTab({vm}: {vm: GlucoseViewModel}) {
    return (
                <div className="space-y-6 animate-soft">
                    <HbA1cEntryForm vm={vm} />
                    <HbA1cTrendChart vm={vm} />
                    <HbA1cRecordList vm={vm} />
                </div>
    );
}
