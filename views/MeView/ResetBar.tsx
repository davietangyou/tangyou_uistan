import type {MeViewModel} from './useMeViewModel';
import {clearAllStorage} from '../../domain';

export function ResetBar(_props: {vm: MeViewModel}) {
    return (
        <>
            {/* ========================================================================= */}
            {/* 系統資料重置按鈕 */}
            {/* ========================================================================= */}
            <div className="text-center pt-4">
                <button
                    onClick={() => {
                        if (confirm('確定要清除所有紀錄嗎？所有個人設定、數據與對話紀錄將無法恢復。')) {
                            clearAllStorage();
                            window.location.reload();
                        }
                    }}
                    className="text-slate-400 hover:text-rose-500 text-xs font-bold transition-all border-b border-dashed border-slate-300 hover:border-rose-400 pb-0.5 cursor-pointer"
                >
                    ⚠️ 重置系統所有資料
                </button>
            </div>
        </>
    );
}
