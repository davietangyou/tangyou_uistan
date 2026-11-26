import type {MeViewModel} from './useMeViewModel';
import {clearAllStorage} from '../../domain';
import {Icon} from '../../components/ui';

export function ResetBar(_props: {vm: MeViewModel}) {
    return (
        <div className="ds-pf-reset">
            {/* 系統資料重置按鈕 */}
            <button
                type="button"
                onClick={() => {
                    if (confirm('確定要清除所有紀錄嗎？所有個人設定、數據與對話紀錄將無法恢復。')) {
                        clearAllStorage();
                        window.location.reload();
                    }
                }}
                className="ds-btn ds-btn-ghost ds-control ds-pf-reset-btn"
            >
                <Icon name="warning" size={20} />
                <span>重置系統所有資料</span>
            </button>
        </div>
    );
}
