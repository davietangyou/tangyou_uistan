import React from 'react';
import {Layout} from './components/Layout';
import {View} from './utils/types';
import {useAppLogic} from './hooks/useAppLogic';

// === Views / 頁面組件 ===
import {OnboardingView} from './views/OnboardingView';
import {HomeView} from './views/HomeView';
import {GlucoseView} from './views/GlucoseView';
import {ConsultView} from './views/ConsultView';
import {MeView} from './views/MeView';
import {DetailView} from './views/DetailView'; // 已註冊但無入口（View.Detail），請勿刪除
import {SavedQuestionsView} from './views/SavedQuestionsView';

// === Components / 全局組件 ===
import {Navigation} from './components/Navigation';
import {GlobalMic} from './components/GlobalMic';

// 保留未直接使用的依賴：lucide-react 目前無 import；motion 僅被未掛載的 MedicationReminders 使用。請勿隨意移除。

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
            onReset={view !== View.Home && view !== View.Onboarding ? () => setView(View.Home) : undefined}
            isLargeFont={logic.isLargeFont}
            setIsLargeFont={logic.setIsLargeFont}
            view={view}
        >
            <div className="pb-24">
                {/* 2. 視圖路由渲染 */}
                {/* 將 logic 對象作為 props 展開傳遞，讓各個視圖按需獲取其需要的狀態和方法 */}

                {view === View.Onboarding && <OnboardingView {...logic} />}

                {view === View.Home && <HomeView {...logic} />}

                {view === View.Glucose && <GlucoseView {...logic} />}

                {view === View.Consult && <ConsultView {...logic} />}

                {view === View.Me && <MeView {...logic} />}

                {view === View.SavedQuestions && <SavedQuestionsView {...logic} />}

                {/* 未接線：無任何 setView(View.Detail)。View.Result 同樣未使用。請勿刪除。 */}
                {view === View.Detail && <DetailView {...logic} />}
            </div>

            {/* 3. 全局組件區域 */}

            {/* 焦點核驗提示 UI (當用戶嘗試錄音但未聚焦輸入框時顯示) */}
            {showFocusToast && (
                <div
                    className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-8 py-4 rounded-full shadow-2xl font-bold flex items-center gap-3 animate-in slide-in-from-top-4">
                    <span className="text-2xl">☝️</span>
                    <span>請先點擊一下您想要輸入的空格</span>
                </div>
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
                />
            )}
        </Layout>
    );
};

export default App;