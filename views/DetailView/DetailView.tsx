/**
 * 完整資料總覽視圖組件
 *
 * 職責：
 * 1. 展示用戶當前會話的所有數據匯總（個人資料、初始困擾、問診對話、補充分享、AI分析結果）。
 * 2. 展示本次會話產生的語音記錄，並支持回放。
 * 3. 提供數據上報功能，將當前會話的所有數據（包括錄音文件和 JSON 報告）上傳至服務器。
 * 4. 展示上傳過程中的實時日誌。
 *
 * 接線狀態（請勿刪除）：App.tsx 已在 view === View.Detail 時渲染本視圖，
 * 但目前沒有任何 UI 調用 setView(View.Detail)，因此使用者無法進入此頁。
 * showDetailTab 也一直為 true，卻未接上導航。將來 UI 重構若要接上資料總覽，應復用本視圖。
 */
import React from 'react';
import type { DetailViewProps } from './types';
import { PageHeader } from './PageHeader';
import { ProfileSection } from './ProfileSection';
import { ConcernSection } from './ConcernSection';
import { ClarificationsSection } from './ClarificationsSection';
import { AnalysisSection } from './AnalysisSection';
import { UploadConsole } from './UploadConsole';

export const DetailView: React.FC<DetailViewProps> = (props) => {
    return (
        <div className="space-y-12 animate-soft pb-24">
            <PageHeader vm={props} />

            <ProfileSection vm={props} />

            <ConcernSection vm={props} />

            <ClarificationsSection vm={props} />

            <AnalysisSection vm={props} />

            <UploadConsole vm={props} />
        </div>
    );
};
