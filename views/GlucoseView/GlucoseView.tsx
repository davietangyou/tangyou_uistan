import React from 'react';
import type {GlucoseViewProps} from './types';
import {useGlucoseViewModel} from './useGlucoseViewModel';
import {BloodGlucoseTab} from './BloodGlucoseTab';
import {SymptomTab} from './SymptomTab';
import {HbA1cTab} from './HbA1cTab';
import {Segmented} from '../../components/ui';

type TabId = 'BG' | 'SYMPTOM' | 'HBA1C';
const TABS = [
    {value: 'BG', label: '血糖紀錄'},
    {value: 'SYMPTOM', label: '症狀紀錄'},
    {value: 'HBA1C', label: '糖化'},
] as const;

export const GlucoseView: React.FC<GlucoseViewProps> = (props) => {
    const vm = useGlucoseViewModel(props);
    const {activeTab, setActiveTab} = vm;

    return (
        <div className="ds-root ds-records">
            <Segmented<TabId>
                name="records-tab"
                value={activeTab}
                options={TABS}
                onChange={setActiveTab}
                aria-label="紀錄類別"
                className="ds-rec-tabs"
            />

            {activeTab === 'BG' && (
                <BloodGlucoseTab vm={vm} />
            )}

            {activeTab === 'SYMPTOM' && (
                <SymptomTab vm={vm} />
            )}

            {activeTab === 'HBA1C' && (
                <HbA1cTab vm={vm} />
            )}
        </div>
    );
};
