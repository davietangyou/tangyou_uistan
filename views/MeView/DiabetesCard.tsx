import type {MeViewModel} from './useMeViewModel';
import type {GroupProps} from './MeView';
import { DiabetesType } from '../../utils/types';
import { HK_HA_MEDICATION_GROUPS } from '../../utils/constants';
import {confirmThen, cx, Icon, SheetSelect} from '../../components/ui';
import {FieldBlock, OptionTile, Pill, ProfileGroup} from '../ProfileShared/formParts';

export function DiabetesCard({vm, open, onToggle}: {vm: MeViewModel} & GroupProps) {
    const {
        customMedName,
        fileInputRef,
        handleMedPhotoUpload,
        isScanningMed,
        profile,
        scanFeedback,
        setCustomMedName,
        setProfile
    } = vm;

    const medCount = profile.medicationDetails?.length || 0;
    const summary = `${profile.isInsulinUser ? '正在注射胰島素' : '未注射胰島素'} · 已登記 ${medCount} 種藥物`;

    const addCustomMed = () => {
        if (!customMedName.trim()) return;
        const name = customMedName.trim();
        const updated = [
            ...(profile.medicationDetails || []),
            { name, dosage: '', usage: '' }
        ];
        setProfile({
            ...profile,
            medicationDetails: updated,
            medications: updated.map(m => m.name).join('、')
        });
        setCustomMedName('');
    };

    return (
        <ProfileGroup id="diabetes" icon="glucose" tone="mist" title="糖尿病相關信息" summary={summary} open={open} onToggle={onToggle}>
            {/* 2. 糖尿病相關信息 */}

            {/* 糖尿病類型 */}
            <FieldBlock label="糖尿病類型" htmlFor="me-dm-type">
                <SheetSelect
                    sheetTitle="糖尿病類型"
                    mode="list"
                    id="me-dm-type"
                    className="ds-field-control ds-control"
                    value={profile.diabetesType || 'TYPE_2'}
                    onChange={e => setProfile({ ...profile, diabetesType: e.target.value as DiabetesType })}
                >
                    <option value="TYPE_2">第 2 型糖尿病 (常見糖尿 / Type 2 DM)</option>
                    <option value="TYPE_1">第 1 型糖尿病 (胰島素依賴 / Type 1 DM)</option>
                    <option value="PRE_DIABETES">糖尿病前期 / 血糖警戒線 (Pre-diabetes)</option>
                    <option value="GESTATIONAL">妊娠期糖尿病 (Gestational DM)</option>
                    <option value="OTHER">其他類型 (Other Types)</option>
                </SheetSelect>
            </FieldBlock>

            {/* 胰島素注射狀態 */}
            <div className="ds-pf-field" role="group" aria-labelledby="me-insulin-label">
                <span className="t-label" id="me-insulin-label">是否正在注射胰島素：</span>
                <div className="ds-pf-options is-two">
                    <OptionTile selected={Boolean(profile.isInsulinUser)} onClick={() => setProfile({ ...profile, isInsulinUser: true })}>
                        是，正在注射胰島素
                    </OptionTile>
                    <OptionTile selected={!profile.isInsulinUser} onClick={() => setProfile({ ...profile, isInsulinUser: false })}>
                        否，未注射胰島素
                    </OptionTile>
                </div>
            </div>

            {/* 智能拍照識藥提醒與按鈕區 */}
            <div className="ds-pf-scan">
                <div className="ds-pf-scan-head">
                    <span className="ds-pf-scan-icon"><Icon name="camera" /></span>
                    <div className="ds-pf-scan-text">
                        <h4 className="t-label">拍照掃描藥袋 / 藥盒</h4>
                        <Pill tone="mist">AI 自動識別</Pill>
                    </div>
                </div>
                <p className="t-body">
                    您可以直接拍照或上傳醫院藥袋、藥盒標籤，AI 會自動為您識別藥物名稱，免去繁瑣打字！
                </p>
                <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleMedPhotoUpload}
                />
                <button
                    type="button"
                    disabled={isScanningMed}
                    onClick={() => fileInputRef.current?.click()}
                    className="ds-btn ds-btn-primary ds-btn-block ds-control ds-pf-scan-btn"
                >
                    {isScanningMed ? (
                        <>
                            <Icon name="loading" className="ds-pf-spin" />
                            <span>AI 正在辨識藥袋上的藥物資訊...</span>
                        </>
                    ) : (
                        <>
                            <Icon name="camera" />
                            <span>拍照 / 上傳藥物照片</span>
                        </>
                    )}
                </button>

                {scanFeedback && (
                    <div className={cx('ds-pf-feedback', scanFeedback.type === 'success' ? 'is-success' : 'is-error')} role="status">
                        <Icon name={scanFeedback.type === 'success' ? 'check' : 'warning'} className="ds-pf-feedback-icon" />
                        <span className="t-body">{scanFeedback.message}</span>
                    </div>
                )}
            </div>

            {/* 現有用藥清單 (同步香港 HA 英文資訊) */}
            <div className="ds-pf-field">
                <div className="ds-pf-field-head is-stack">
                    <span className="t-label">現時服用之糖尿專科藥物清單 (HA Drug Formulary)：</span>
                    <Pill tone="sage">已登記 {medCount} 種藥物</Pill>
                </div>

                {profile.medicationDetails && profile.medicationDetails.length > 0 ? (
                    <ul className="ds-pf-meds">
                        {profile.medicationDetails.map((med, idx) => (
                            <li key={idx} className="ds-pf-med">
                                <Icon name="medication" className="ds-pf-med-icon" />
                                <span className="t-body-strong ds-pf-med-name">{med.name}</span>
                                <button
                                    type="button"
                                    onClick={() => confirmThen(`刪除「${med.name}」？`, '刪除後要重新輸入或拍照辨識。', '刪除', () => {
                                        const next = profile.medicationDetails?.filter((_, i) => i !== idx);
                                        setProfile({
                                            ...profile,
                                            medicationDetails: next,
                                            medications: (next || []).map(m => m.name).join('、')
                                        });
                                    })}
                                    className="ds-icon-btn ds-icon-btn-plain ds-control ds-pf-danger-icon"
                                    title="刪除此藥物"
                                    aria-label={`刪除此藥物：${med.name}`}
                                >
                                    <Icon name="close" />
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="t-body t-ink-2 ds-pf-empty">
                        尚未登記任何糖尿專科藥物，可由下方手動選擇或自訂新增。
                    </p>
                )}

                {/* 手動選擇香港常見糖尿專科藥物 (同步香港 HA 醫管局藥物名冊，以英文為主顯示) */}
                <SheetSelect
                    sheetTitle="選擇香港 HA 常見糖尿專科藥物"
                    mode="list"
                    triggerClassName="ds-pf-med-picker"
                    className="ds-field-control ds-control"
                    aria-label="選擇香港 HA 常見糖尿專科藥物"
                    onChange={(e) => {
                        if (!e.target.value) return;
                        const medName = e.target.value;
                        const exists = profile.medicationDetails?.find(m => m.name === medName);
                        if (!exists) {
                            const updated = [
                                ...(profile.medicationDetails || []),
                                { name: medName, dosage: '', usage: '' }
                            ];
                            setProfile({
                                ...profile,
                                medicationDetails: updated,
                                medications: updated.map(m => m.name).join('、')
                            });
                        }
                        e.target.value = '';
                    }}
                >
                    <option value="">＋ 選擇香港 HA 常見糖尿專科藥物 (英文為主)...</option>
                    {HK_HA_MEDICATION_GROUPS.map(group => (
                        <optgroup key={group.category} label={group.category}>
                            {group.meds.map(m => (
                                <option key={m.name} value={m.name}>
                                    {m.label}
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </SheetSelect>

                <div className="ds-pf-inline">
                    <input
                        placeholder="或輸入其他藥名 (英文/中文)..."
                        aria-label="自訂藥名"
                        className="ds-field-control ds-control"
                        value={customMedName}
                        onChange={(e) => setCustomMedName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && customMedName.trim()) {
                                addCustomMed();
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={addCustomMed}
                        disabled={!customMedName.trim()}
                        className="ds-btn ds-btn-primary ds-control ds-pf-inline-btn"
                    >
                        新增
                    </button>
                </div>
            </div>
        </ProfileGroup>
    );
}
