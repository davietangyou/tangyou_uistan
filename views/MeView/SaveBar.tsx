import type {MeViewModel} from './useMeViewModel';
import {persistProfile} from '../../domain';

export function SaveBar({vm}: {vm: MeViewModel}) {
    const {
        profile,
        saveSuccess,
        setSaveSuccess
    } = vm;

    return (
        <>
            {/* ========================================================================= */}
            {/* 保存修改按鈕 */}
            {/* ========================================================================= */}
            <div className="pt-2 space-y-3">
                <button
                    onClick={() => {
                        persistProfile(profile);
                        setSaveSuccess(true);
                        setTimeout(() => setSaveSuccess(false), 2500);
                    }}
                    className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                        saveSuccess
                            ? 'bg-emerald-600 text-white shadow-emerald-200'
                            : 'bg-[#4A6E85] hover:bg-[#3d5b6e] text-white shadow-[#4A6E85]/20 active:scale-[0.99]'
                    }`}
                >
                    <span>{saveSuccess ? '✓ 已成功保存修改' : '💾 保存修改'}</span>
                </button>

                {saveSuccess && (
                    <div className="text-center text-xs font-bold text-emerald-600 animate-fade-in">
                        個人檔案已成功更新並同步至 AI 諮詢系統！
                    </div>
                )}
            </div>
        </>
    );
}
