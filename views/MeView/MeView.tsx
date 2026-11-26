import React from 'react';
import type {MeViewProps} from './types';
import {useMeViewModel} from './useMeViewModel';
import {PersonalInfoCard} from './PersonalInfoCard';
import {DiabetesCard} from './DiabetesCard';
import {ConditionsCard} from './ConditionsCard';
import {CaregiverCard} from './CaregiverCard';
import {LifestyleCard} from './LifestyleCard';
import {SaveBar} from './SaveBar';
import {ResetBar} from './ResetBar';

export const MeView: React.FC<MeViewProps> = (props) => {
    const vm = useMeViewModel(props);
    const {isLargeFont} = vm;

    return (
        <div className={`space-y-6 animate-soft pb-24 ${isLargeFont ? 'spacy-container !px-0' : ''}`}>
            
            {/* 頂部標題 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                    <h2 className={`font-black text-slate-900 tracking-tight flex items-center gap-2 ${isLargeFont ? 'text-3xl' : 'text-xl sm:text-2xl'}`}>
                        <span>👤</span>
                        <span>個人檔案</span>
                    </h2>
                    <p className={`text-slate-500 font-bold ${isLargeFont ? 'text-base' : 'text-xs'}`}>
                        隨時查看與直接修改您的健康資料，所有變更即時保存，為 AI 提供準確的分析基礎。
                    </p>
                </div>
            </div>

            <PersonalInfoCard vm={vm} />

            <DiabetesCard vm={vm} />

            <ConditionsCard vm={vm} />

            <CaregiverCard vm={vm} />

            <LifestyleCard vm={vm} />

            <SaveBar vm={vm} />

            <ResetBar vm={vm} />

        </div>
    );
};
