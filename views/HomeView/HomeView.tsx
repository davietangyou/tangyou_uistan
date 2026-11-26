import React from 'react';
import type { HomeViewProps } from './types';
import { useHomeViewModel } from './useHomeViewModel';
import { GreetingCard } from './GreetingCard';
import { ClinicTodayBanner } from './ClinicTodayBanner';
import { ClinicCard } from './ClinicCard';
import { LifestyleGuide } from './LifestyleGuide';
import { AskAiButton } from './AskAiButton';

export const HomeView: React.FC<HomeViewProps> = (props) => {
    const vm = useHomeViewModel(props);
    const { isLargeFont } = vm;

    return (
        <div className={`space-y-3.5 animate-soft pb-20 ${isLargeFont ? 'spacy-container !px-0' : ''}`}>
            <GreetingCard vm={vm} />

            <ClinicTodayBanner vm={vm} />

            <ClinicCard vm={vm} />

            <LifestyleGuide vm={vm} />

            <AskAiButton vm={vm} />
        </div>
    );
};
