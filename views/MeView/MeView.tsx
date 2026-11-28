import React, {useRef, useState} from 'react';
import type {UserProfile} from '../../utils/types';
import {ProfileEditorContext} from '../ProfileShared/formParts';
import type {MeViewProps} from './types';
import {useMeViewModel} from './useMeViewModel';
import {PersonalInfoCard} from './PersonalInfoCard';
import {DiabetesCard} from './DiabetesCard';
import {ConditionsCard} from './ConditionsCard';
import {CaregiverCard} from './CaregiverCard';
import {LifestyleCard} from './LifestyleCard';
import {SaveBar} from './SaveBar';
import {ResetBar} from './ResetBar';
import {IdentityCard} from './IdentityCard';

export type ProfileGroupId = 'personal' | 'diabetes' | 'conditions' | 'caregiver' | 'lifestyle';
export interface GroupProps {
    open: boolean;
    onToggle: () => void;
}

export const MeView: React.FC<MeViewProps> = (props) => {
    const vm = useMeViewModel(props);
    // 分組（只影響顯示，不影響資料）。S4 起每組是目錄行，點入以子頁編輯；預設都不打開。
    const [openGroups, setOpenGroups] = useState<Record<ProfileGroupId, boolean>>({
        personal: false,
        diabetes: false,
        conditions: false,
        caregiver: false,
        lifestyle: false,
    });
    // D-b2：進入編輯器時記下當時的檔案；「取消」把它放回去（欄位仍即時寫入）。
    const snapshots = useRef<Partial<Record<ProfileGroupId, UserProfile>>>({});
    const group = (id: ProfileGroupId): GroupProps => ({
        open: openGroups[id],
        onToggle: () => {
            if (!openGroups[id]) snapshots.current[id] = vm.profile;
            setOpenGroups((g) => ({...g, [id]: !g[id]}));
        },
    });
    const editor = {
        cancel: (id: string) => {
            const snap = snapshots.current[id as ProfileGroupId];
            if (snap) vm.setProfile(snap);
            setOpenGroups((g) => ({...g, [id]: false}));
        },
        cancelDisabled: vm.isScanningMed,
    };

    return (
        <div className="ds-root ds-profile">
            {/* 頂部標題 */}
            <header className="ds-pf-header">
                <h2 className="t-h1 ds-page-lead">我的</h2>
                <p className="t-body t-ink-2">
                    隨時查看與直接修改您的健康資料，所有變更即時保存，為 AI 提供準確的分析基礎。
                </p>
            </header>

            <IdentityCard profile={vm.profile} />

            <ProfileEditorContext.Provider value={editor}>
                <div className="ds-card ds-pf-directory">
                    <PersonalInfoCard vm={vm} {...group('personal')} />

                    <DiabetesCard vm={vm} {...group('diabetes')} />

                    <ConditionsCard vm={vm} {...group('conditions')} />

                    <CaregiverCard vm={vm} {...group('caregiver')} />

                    <LifestyleCard vm={vm} {...group('lifestyle')} />
                </div>
            </ProfileEditorContext.Provider>

            <SaveBar vm={vm} />

            <ResetBar vm={vm} />
        </div>
    );
};
