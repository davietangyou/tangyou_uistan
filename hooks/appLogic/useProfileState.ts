import {useEffect, useState} from 'react';
import type {DecisionResult, UserProfile} from '../../utils/types';
import * as DataService from '../../services/dataService';
import {loadProfileFromStorage, persistProfile, toggleConditionOnProfile, mergeSavedDoctorQuestions} from '../../domain';

export function useProfileState() {
    const [profile, setProfile] = useState<UserProfile>(() => loadProfileFromStorage());

    const [onboardingStep, setOnboardingStep] = useState(1);

    useEffect(() => persistProfile(profile), [profile]);

    const updateProfileWithExtraction = (extracted?: DecisionResult['extractedProfileData']) => {
        if (!extracted) return;
        const updated = DataService.applyProfileUpdate(profile, extracted);
        setProfile(updated);
    };

    // 切換病症狀態
    const toggleCondition = (cond: string) => {
        setProfile(toggleConditionOnProfile(profile, cond));
    };

    // 保存醫生問題
    const saveDoctorQuestions = (questions: string[]) => {
        const updated = mergeSavedDoctorQuestions(profile, questions);
        if (updated === profile) return;
        setProfile(updated);
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
