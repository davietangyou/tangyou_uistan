/**
 * 專為香港長者設計的「溫馨用藥提醒與守護」組件。
 *
 * 接線狀態（請勿刪除）：本組件已完整實作，但目前沒有任何頁面 import 或掛載它。
 * 將來 UI 重構若要接上用藥提醒，應復用本組件。本檔使用 package.json 中的 motion 依賴。
 */
import React from 'react';
import type { MedicationRemindersProps } from './types';
import { useMedicationReminders } from './useMedicationReminders';
import { MissedDoseBanner } from './MissedDoseBanner';
import { CelebrationBanner } from './CelebrationBanner';
import { TodayCard } from './TodayCard';
import { ManageModal } from './ManageModal';
import { ReminderPopup } from './ReminderPopup';

export const MedicationReminders: React.FC<MedicationRemindersProps> = (props) => {
    const vm = useMedicationReminders(props);

    return (
        <div className="space-y-1.5">
            <MissedDoseBanner vm={vm} />

            <CelebrationBanner vm={vm} />

            <TodayCard vm={vm} />

            <ManageModal vm={vm} />

            <ReminderPopup vm={vm} />
        </div>
    );
};
