import React from 'react';
import {Layout} from './components/Layout';
import {View} from './utils/types';
import {useAppLogic} from './hooks/useAppLogic';

// === Components / 全局組件 ===
import {Navigation} from './components/Navigation';
import {GlobalMic} from './components/GlobalMic';
import {ViewRouter} from './components/ViewRouter';
import {FocusToast} from './components/FocusToast';

// 依賴說明：lucide-react 自階段三起由外殼（components/ui/icons.ts）使用。motion 原只被未掛載的 MedicationReminders 使用，該組件已於階段十一刪除；依賴仍列在 package.json（未改動）。

/**
 * App Component
 *
 * 應用程式的主入口點。
 * 職責：
 * 1. 初始化核心業務邏輯 Hook (useAppLogic)。
 * 2. 負責路由調度 (根據 View 狀態渲染對應的視圖組件)。
 * 3. 渲染全局 UI 元素 (Layout, 懸浮麥克風, 導航欄, Toast 提示)。
 */
const App: React.FC = () => {
    // 1. 獲取所有應用狀態和方法
    // useAppLogic 內部整合了 Profile, Glucose, Consult, Speech 等所有邏輯
    const logic = useAppLogic();

    // 解構部分需要在 App 層直接使用的狀態
    const {
        view,
        setView,
        showFocusToast,
        isListening,
        isProcessing,
        handleGlobalMicClick
    } = logic;

    return (
        <Layout
            isLargeFont={logic.isLargeFont}
            setIsLargeFont={logic.setIsLargeFont}
            view={view}
        >
            <div className="pb-6">
                {/* 2. 視圖路由渲染 */}
                {/* 將 logic 對象作為 props 展開傳遞，讓各個視圖按需獲取其需要的狀態和方法 */}

                <ViewRouter logic={logic} />
            </div>

            {/* 3. 全局組件區域 */}

            {/* 焦點核驗提示 UI (當用戶嘗試錄音但未聚焦輸入框時顯示) */}
            {showFocusToast && (
                <FocusToast />
            )}

            {/* 全局懸浮麥克風 */}
            <GlobalMic
                isListening={isListening}
                isProcessing={isProcessing}
                onClick={handleGlobalMicClick}
            />

            {/* 底部導航欄 (在引導頁不顯示) */}
            {view !== View.Onboarding && (
                <Navigation
                    view={view}
                    setView={setView}
                    setConsultStep={logic.setConsultStep}
                />
            )}
        </Layout>
    );
};

export default App;
