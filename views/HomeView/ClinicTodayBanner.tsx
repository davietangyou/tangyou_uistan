import {View} from '../../utils/types';
import {Button, uiIcons} from '../../components/ui';
import type {HomeViewModel} from './useHomeViewModel';

export function ClinicTodayBanner({vm}: {vm: HomeViewModel}) {
    const {setView, dateReminderStatus} = vm;
    if (dateReminderStatus !== 'TODAY') return null;

    const WarningIcon = uiIcons.warning;

    return (
        <div className="ds-home-today">
            <div className="ds-home-today-row">
                <span className="ds-home-today-mark" aria-hidden><WarningIcon size={24} strokeWidth={2} /></span>
                <div className="ds-home-today-copy">
                    <p className="t-body-strong">【今日就診提醒】</p>
                    <p className="t-body">今日係您預定的問診覆診日！</p>
                    <p className="t-caption">記得帶齊血糖紀錄與下方挑選好的「問診清單」俾醫生睇呀！</p>
                </div>
            </div>
            <Button variant="secondary" fullWidth onClick={() => setView(View.SavedQuestions)}>
                查看清單
            </Button>
        </div>
    );
}
