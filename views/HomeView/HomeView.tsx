import React from 'react';
import type {HomeViewProps} from './types';
import {useHomeViewModel} from './useHomeViewModel';
import {GreetingCard} from './GreetingCard';
import {AskAiButton} from './AskAiButton';
import {ClinicTodayBanner} from './ClinicTodayBanner';
import {ClinicCard} from './ClinicCard';
import {LatestGlucoseCard} from './LatestGlucoseCard';
import {LifestyleGuide} from './LifestyleGuide';
import {TodayMedicationCard} from './TodayMedicationCard';

export const HomeView: React.FC<HomeViewProps> = (props) => {
    const vm = useHomeViewModel(props);

    return (
        <div className="ds-root ds-home">
            <GreetingCard vm={vm} />
            <ClinicTodayBanner vm={vm} />
            <AskAiButton vm={vm} />
            <ClinicCard vm={vm} />
            <div className="ds-home-pair">
                <LatestGlucoseCard vm={vm} />
                <TodayMedicationCard vm={vm} />
            </div>
            <LifestyleGuide vm={vm} />
        </div>
    );
};
