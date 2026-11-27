import {View} from '../../utils/types';
import {BottomSheet, Button, EmptyState, Field, uiIcons} from '../../components/ui';
import type {HomeViewModel} from './useHomeViewModel';

export function ClinicCard({vm}: {vm: HomeViewModel}) {
    const {
        setView,
        nextClinicDate,
        nextClinicQuestions,
        isEditingDate, setIsEditingDate,
        tempDate, setTempDate,
        dateReminderStatus, daysDiff,
        handleSaveDate,
    } = vm;
    const CalendarIcon = uiIcons.calendar;
    const cancelEdit = () => {
        setTempDate(nextClinicDate);
        setIsEditingDate(false);
    };

    return (
        <section className="ds-home-clinic">
            <div className="ds-home-clinic-head">
                <h2 className="t-h2">下次問診清單</h2>
                <p className="t-caption">覆診時拿給醫生看，溝通更精準省時</p>
            </div>

            <div className="ds-home-clinic-date">
                <div className="ds-home-clinic-date-row">
                    {nextClinicDate ? (
                        <>
                            <span className="ds-home-chip">
                                <CalendarIcon size={18} strokeWidth={1.75} aria-hidden />
                                {nextClinicDate}
                            </span>
                            {dateReminderStatus === 'TODAY' && (
                                <span className="ds-home-chip ds-home-chip-today">今日！</span>
                            )}
                            {dateReminderStatus === 'FUTURE' && (
                                <span className="ds-home-chip ds-home-chip-future">還有 {daysDiff} 日</span>
                            )}
                            {dateReminderStatus === 'PAST' && (
                                <span className="ds-home-chip ds-home-chip-past">已過期</span>
                            )}
                        </>
                    ) : (
                        <span className="ds-home-chip ds-home-chip-none">未設定日期</span>
                    )}
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setTempDate(nextClinicDate || new Date().toISOString().split('T')[0]);
                            setIsEditingDate(true);
                        }}
                        title="設定/修改問診日期"
                    >
                        {nextClinicDate ? '改期' : '設日期'}
                    </Button>
                </div>
            </div>

            {/* S4: the date is picked in a bottom sheet (same draft, same 保存 / 取消). */}
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

            {nextClinicQuestions.length === 0 ? (
                <EmptyState
                    className="ds-home-clinic-empty"
                    icon="savedQuestions"
                    tone="lilac"
                    title="目前尚未挑選下次問診問題"
                    action={
                        <Button fullWidth onClick={() => setView(View.SavedQuestions)}>
                            前往挑選問診問題
                        </Button>
                    }
                >
                    <p className="t-caption">可在「問題紀錄」的【AI 總結】中挑選重點問題，隨時同步至此清單！</p>
                </EmptyState>
            ) : (
                <div className="ds-stack-cards">
                    {nextClinicQuestions.map((q, qIdx) => (
                        <div key={qIdx} className="ds-home-q">
                            <span className="ds-home-q-index">{qIdx + 1}</span>
                            <p className="t-body-strong ds-home-q-text">{q}</p>
                        </div>
                    ))}
                    <div className="ds-home-clinic-foot">
                        <p className="t-caption">共挑選 {nextClinicQuestions.length} 題</p>
                        <Button variant="secondary" fullWidth onClick={() => setView(View.SavedQuestions)}>
                            管理/增減問題
                        </Button>
                    </div>
                </div>
            )}
        </section>
    );
}
