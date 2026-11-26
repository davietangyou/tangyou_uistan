import type {UserProfile} from '../../utils/types';
import {profileWithHeight, profileWithWeight, profileWithWeightUnit, updateConditionDetail} from '../../domain';
import type {OnboardingViewProps} from './types';

export function useOnboardingViewModel(props: OnboardingViewProps) {
    const {
        profile,
        setProfile,
        onboardingStep,
        setOnboardingStep,
        setView,
        toggleCondition,
        isLargeFont
    } = props;

    const handleHeightChange = (val: string) => {
        setProfile(profileWithHeight(profile, val));
    };

    const handleWeightChange = (val: string) => {
        setProfile(profileWithWeight(profile, val));
    };

    const handleWeightUnitChange = (unit: 'kg' | 'lb') => {
        setProfile(profileWithWeightUnit(profile, unit));
    };

    const handleUpdateConditionDetail = (conditionId: string, field: 'years' | 'specificName', value: string) => {
        setProfile(updateConditionDetail(profile, conditionId, field, value));
    };

    // 已選疾病列表（排除 'NONE'）
    const selectedConditions = (profile.conditions || []).filter(c => c !== 'NONE');
    const isNoneSelected = (profile.conditions || []).includes('NONE');
    const isDiabetesSelected = selectedConditions.includes('DM');
    const nonDiabetesSelected = selectedConditions.filter(c => c !== 'DM');

    return {
        profile,
        setProfile,
        onboardingStep,
        setOnboardingStep,
        setView,
        toggleCondition,
        isLargeFont,
        handleHeightChange,
        handleWeightChange,
        handleWeightUnitChange,
        handleUpdateConditionDetail,
        selectedConditions,
        isNoneSelected,
        isDiabetesSelected,
        nonDiabetesSelected,
    };
}

export type OnboardingViewModel = ReturnType<typeof useOnboardingViewModel>;
