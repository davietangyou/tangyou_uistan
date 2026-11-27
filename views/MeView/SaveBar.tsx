import type {MeViewModel} from './useMeViewModel';
import {persistProfile} from '../../domain';
import {cx, Icon} from '../../components/ui';

export function SaveBar({vm}: {vm: MeViewModel}) {
    const {
        profile,
        saveSuccess,
        setSaveSuccess
    } = vm;

    return (
        <div className="ds-pf-save">
            {/* 保存修改按鈕 */}
            <button
                type="button"
                data-verify="me-save"
                onClick={() => {
                    persistProfile(profile);
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 2500);
                }}
                className={cx('ds-btn ds-btn-block ds-control ds-pf-save-btn', saveSuccess ? 'is-saved' : 'ds-btn-primary')}
            >
                {saveSuccess && <Icon name="check" />}
                <span>{saveSuccess ? '已成功保存修改' : '保存修改'}</span>
            </button>

            {saveSuccess && (
                <p className="t-body-strong ds-pf-save-note" role="status">
                    個人檔案已成功更新並同步至 AI 諮詢系統！
                </p>
            )}
        </div>
    );
}
