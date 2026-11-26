import React, {useState} from 'react';
import type {MeViewProps} from './types';
import {useMeViewModel} from './useMeViewModel';
import {PersonalInfoCard} from './PersonalInfoCard';
import {DiabetesCard} from './DiabetesCard';
import {ConditionsCard} from './ConditionsCard';
import {CaregiverCard} from './CaregiverCard';
import {LifestyleCard} from './LifestyleCard';
import {SaveBar} from './SaveBar';
import {ResetBar} from './ResetBar';

export type ProfileGroupId = 'personal' | 'diabetes' | 'conditions' | 'caregiver' | 'lifestyle';
export interface GroupProps {
    open: boolean;
    onToggle: () => void;
}

export const MeView: React.FC<MeViewProps> = (props) => {
    const vm = useMeViewModel(props);
    // 分組折叠（只影響顯示，不影響資料）：預設展開【個人信息】
    const [openGroups, setOpenGroups] = useState<Record<ProfileGroupId, boolean>>({
        personal: true,
        diabetes: false,
        conditions: false,
        caregiver: false,
        lifestyle: false,
    });
    const group = (id: ProfileGroupId): GroupProps => ({
        open: openGroups[id],
        onToggle: () => setOpenGroups((g) => ({...g, [id]: !g[id]})),
    });

    return (
        <div className="ds-root ds-profile">
            {/* 頂部標題 */}
            <header className="ds-pf-header">
                <h2 className="t-h1">個人檔案</h2>
                <p className="t-body t-ink-2">
                    隨時查看與直接修改您的健康資料，所有變更即時保存，為 AI 提供準確的分析基礎。
                </p>
            </header>

            <PersonalInfoCard vm={vm} {...group('personal')} />

            <DiabetesCard vm={vm} {...group('diabetes')} />

            <ConditionsCard vm={vm} {...group('conditions')} />

            <CaregiverCard vm={vm} {...group('caregiver')} />

            <LifestyleCard vm={vm} {...group('lifestyle')} />

            <SaveBar vm={vm} />

            <ResetBar vm={vm} />
        </div>
    );
};
