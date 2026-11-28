import {View} from '../../utils/types';
import {BottomSheet, Button, Field} from '../../components/ui';
import type {HomeViewModel} from './useHomeViewModel';

export function ClinicCard({vm}: {vm: HomeViewModel}) {
    const {
        setView,
        nextClinicDate, nextClinicTime, nextClinicLocation,
        tempTime, setTempTime, tempLocation, setTempLocation,
        isEditingDate, setIsEditingDate,
        tempDate, setTempDate,
        dateReminderStatus, daysDiff,
        handleSaveDate,
    } = vm;
    const cancelEdit = () => {
        setTempDate(nextClinicDate);
        setTempTime(nextClinicTime);
        setTempLocation(nextClinicLocation);
        setIsEditingDate(false);
    };
    const openEditor = () => {
        setTempDate(nextClinicDate || new Date().toISOString().split('T')[0]);
        setTempTime(nextClinicTime);
        setTempLocation(nextClinicLocation);
        setIsEditingDate(true);
    };

    let dateLine = '尚未設定覆診日期';
    let dateTail = '';
    if (nextClinicDate) {
        dateLine = nextClinicDate;
        if (dateReminderStatus === 'TODAY') dateTail = '今日';
        else if (dateReminderStatus === 'FUTURE') dateTail = `還有 ${daysDiff} 日`;
        else if (dateReminderStatus === 'PAST') dateTail = '已過期';
    }

    return (
        <section className="ds-home-clinic">
            <div className="ds-home-clinic-copy">
                <p className="ds-home-clinic-kicker">覆診安排</p>
                <h2 className="ds-home-clinic-title">下次覆診</h2>
                <p className="ds-home-clinic-date">
                    <span className="ds-nowrap">{dateLine}</span>
                    {dateTail && <> · <span className="ds-nowrap">{dateTail}</span></>}
                </p>
                {nextClinicDate && (nextClinicTime || nextClinicLocation) && (
                    <p className="ds-home-clinic-meta">
                        {nextClinicTime && <span className="ds-nowrap">{nextClinicTime}</span>}
                        {nextClinicTime && nextClinicLocation && ' · '}
                        {nextClinicLocation}
                    </p>
                )}
            </div>

            <div className="ds-home-clinic-actions">
                <button
                    type="button"
                    className="ds-home-clinic-btn ds-control"
                    data-verify="home-clinic-edit"
                    onClick={openEditor}
                    title="設定/修改問診日期"
                >
                    {nextClinicDate ? '改期' : '新增覆診資料'}
                </button>
                <button
                    type="button"
                    className="ds-home-clinic-btn ds-control"
                    onClick={() => setView(View.SavedQuestions)}
                >
                    查看覆診清單
                </button>
            </div>

            <BottomSheet
                open={isEditingDate}
                onClose={cancelEdit}
                title="覆診資料"
                hideClose
                footer={
                    <>
                        <Button variant="secondary" onClick={cancelEdit}>取消</Button>
                        <Button data-verify="home-clinic-save" onClick={handleSaveDate}>保存</Button>
                    </>
                }
            >
                <div className="ds-home-clinic-edit">
                    <Field
                        label="覆診日期"
                        type="date"
                        data-verify="home-clinic-date"
                        value={tempDate}
                        onChange={(e) => setTempDate(e.target.value)}
                    />
                    <Field
                        label="時間（選填）"
                        type="time"
                        data-verify="home-clinic-time"
                        value={tempTime}
                        onChange={(e) => setTempTime(e.target.value)}
                    />
                    <Field
                        label="地點（選填）"
                        type="text"
                        data-verify="home-clinic-location"
                        value={tempLocation}
                        placeholder="例如：葵涌普通科門診"
                        maxLength={80}
                        onChange={(e) => setTempLocation(e.target.value)}
                    />
                </div>
            </BottomSheet>
        </section>
    );
}
