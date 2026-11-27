/**
 * 我的問題與 AI 總結視圖
 *
 * 職責：
 * 1. AI 總結置頂於前面，歸納保存的 3-5 類別問題，並提供候選問診問題供病人挑選保存至「下次問診清單」。
 * 2. 提供「下次問診清單」管理（可添加、移除、自訂新增想問的問題）。
 * 3. 支援所有保存問題的檢視與手動新增/編輯/刪除。
 */
import React, { useEffect } from 'react';
import type { SavedQuestionsViewProps } from './types';
import { useSavedQuestionsViewModel } from './useSavedQuestionsViewModel';
import { PageHeader } from './PageHeader';
import { AnalysisSection } from './AnalysisSection';
import { NextClinicSection } from './NextClinicSection';
import { SavedListSection } from './SavedListSection';
import { useViewActive } from '../../components/shell/viewPane';

export const SavedQuestionsView: React.FC<SavedQuestionsViewProps> = (props) => {
    const vm = useSavedQuestionsViewModel(props);

    // 階段 S2：此頁離場後保持掛載（AI 總結不會因切頁而丟失）。離場時只收起「按位置編輯」的兩個編輯態
    // （改問題、改覆診日期），讓它們與從前離場即卸載時一樣從頭開始——問 AI 會把新問題插到清單最前面，
    // 舊的位置索引回來後可能指向另一題。新增中的草稿不依賴位置，照樣保留。
    const isActive = useViewActive();
    useEffect(() => {
        if (isActive) return;
        vm.setEditingIndex(null);
        vm.setEditingText('');
        vm.setIsEditingDate(false);
        vm.setTempClinicDate(vm.nextClinicDate);
    }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="ds-root ds-questions">
            <PageHeader vm={vm} />

            <AnalysisSection vm={vm} />

            <NextClinicSection vm={vm} />

            <SavedListSection vm={vm} />
        </div>
    );
};
