/**
 * 我的問題與 AI 總結視圖
 *
 * 職責：
 * 1. AI 總結置頂於前面，歸納保存的 3-5 類別問題，並提供候選問診問題供病人挑選保存至「下次問診清單」。
 * 2. 提供「下次問診清單」管理（可添加、移除、自訂新增想問的問題）。
 * 3. 支援所有保存問題的檢視與手動新增/編輯/刪除。
 */
import React from 'react';
import type { SavedQuestionsViewProps } from './types';
import { useSavedQuestionsViewModel } from './useSavedQuestionsViewModel';
import { PageHeader } from './PageHeader';
import { AnalysisSection } from './AnalysisSection';
import { NextClinicSection } from './NextClinicSection';
import { SavedListSection } from './SavedListSection';

export const SavedQuestionsView: React.FC<SavedQuestionsViewProps> = (props) => {
    const vm = useSavedQuestionsViewModel(props);

    return (
        <div className="ds-root ds-questions">
            <PageHeader vm={vm} />

            <AnalysisSection vm={vm} />

            <NextClinicSection vm={vm} />

            <SavedListSection vm={vm} />
        </div>
    );
};
