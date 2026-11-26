import {useEffect, useState} from 'react';
import type {DecisionResult, UserProfile} from '../../utils/types';
import * as DataService from '../../services/dataService';
import {loadProfileFromStorage} from './loadProfile';

export function useProfileState() {
    const [profile, setProfile] = useState<UserProfile>(() => loadProfileFromStorage());

    const [onboardingStep, setOnboardingStep] = useState(1);

    useEffect(() => localStorage.setItem('dia_profile', JSON.stringify(profile)), [profile]);

    const updateProfileWithExtraction = (extracted?: DecisionResult['extractedProfileData']) => {
        if (!extracted) return;
        const updated = DataService.applyProfileUpdate(profile, extracted);
        setProfile(updated);
    };

    // 切換病症狀態
    const toggleCondition = (cond: string) => {
        const current = profile.conditions || [];
        if (cond === 'NONE') {
            setProfile({...profile, conditions: ['NONE']});
            return;
        }
        let next = current.filter(c => c !== 'NONE');
        if (next.includes(cond)) {
            next = next.filter(c => c !== cond);
        } else {
            next = [...next, cond];
        }
        setProfile({...profile, conditions: next});
    };

    // 保存醫生問題
    const saveDoctorQuestions = (questions: string[]) => {
        if (!questions.length) return;
        const current = profile.savedDoctorQuestions || [];
        // 合併並去重，保持最新
        const updated = [...new Set([...questions, ...current])];
        setProfile({...profile, savedDoctorQuestions: updated});
    };

    // 上报完整数据流程 (Refactored using DataService)
    // 核心逻辑保留：遍历录音 -> 上传 -> 获取URL -> 组装JSON -> 上传JSON

    return {
        profile, setProfile,
        onboardingStep, setOnboardingStep,
        updateProfileWithExtraction,
        toggleCondition,
        saveDoctorQuestions,
    };
}
