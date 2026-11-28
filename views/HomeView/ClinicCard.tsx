import {View} from '../../utils/types';
import {BottomSheet, Button, Field} from '../../components/ui';
import type {HomeViewModel} from './useHomeViewModel';

export function ClinicCard({vm}: {vm: HomeViewModel}) {
    const {
        setView,
        nextClinicDate,
        isEditingDate, setIsEditingDate,
        tempDate, setTempDate,
        dateReminderStatus, daysDiff,
        handleSaveDate,
    } = vm;
    const cancelEdit = () => {
        setTempDate(nextClinicDate);
        setIsEditingDate(false);
    };
    const openEditor = () => {
        setTempDate(nextClinicDate || new Date().toISOString().split('T')[0]);
        setIsEditingDate(true);
    };

    let dateLine = '尚未設定覆診日期';
    if (nextClinicDate) {
        dateLine = nextClinicDate;
        if (dateReminderStatus === 'TODAY') dateLine = `${nextClinicDate} · 今日`;
        else if (dateReminderStatus === 'FUTURE') dateLine = `${nextClinicDate} · 還有 ${daysDiff} 日`;
        else if (dateReminderStatus === 'PAST') dateLine = `${nextClinicDate} · 已過期`;
    }

    return (
        <section className="ds-home-clinic">
            <div className="ds-home-clinic-copy">
                <p className="ds-home-clinic-kicker">覆診安排</p>
                <h2 className="ds-home-clinic-title">下次覆診</h2>
                <p className="ds-home-clinic-date">{dateLine}</p>
            </div>

            <div className="ds-home-clinic-actions">
                <button
                    type="button"
                    className="ds-home-clinic-btn ds-control"
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
                title="設定覆診日期"
                hideClose
                footer={
                    <>
                        <Button variant="secondary" onClick={cancelEdit}>取消</Button>
                        <Button onClick={handleSaveDate}>保存</Button>
                    </>
                }
            >
                <div className="ds-home-clinic-edit">
                    <Field
                        label="覆診日期"
                        type="date"
                        value={tempDate}
                        onChange={(e) => setTempDate(e.target.value)}
                    />
                </div>
            </BottomSheet>
        </section>
    );
}
