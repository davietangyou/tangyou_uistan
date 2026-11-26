import type {MeViewModel} from './useMeViewModel';
import { DiabetesType } from '../../utils/types';
import { HK_HA_MEDICATION_GROUPS } from '../../utils/constants';

export function DiabetesCard({vm}: {vm: MeViewModel}) {
    const {
        customMedName,
        fileInputRef,
        handleMedPhotoUpload,
        isLargeFont,
        isScanningMed,
        profile,
        scanFeedback,
        setCustomMedName,
        setProfile
    } = vm;

    return (
        <>
            {/* ========================================================================= */}
            {/* 2. 糖尿病相關信息卡片 */}
            {/* ========================================================================= */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h3 className={`font-black text-[#4A6E85] flex items-center gap-1.5 ${isLargeFont ? 'text-xl' : 'text-sm sm:text-base'}`}>
                        <span>🍬</span>
                        <span>【糖尿病相關信息】</span>
                    </h3>
                </div>

                {/* 糖尿病類型 */}
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">糖尿病類型</label>
                    <select
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#4A6E85] outline-none font-black text-sm text-slate-800"
                        value={profile.diabetesType || 'TYPE_2'}
                        onChange={e => setProfile({ ...profile, diabetesType: e.target.value as DiabetesType })}
                    >
                        <option value="TYPE_2">第 2 型糖尿病 (常見糖尿 / Type 2 DM)</option>
                        <option value="TYPE_1">第 1 型糖尿病 (胰島素依賴 / Type 1 DM)</option>
                        <option value="PRE_DIABETES">糖尿病前期 / 血糖警戒線 (Pre-diabetes)</option>
                        <option value="GESTATIONAL">妊娠期糖尿病 (Gestational DM)</option>
                        <option value="OTHER">其他類型 (Other Types)</option>
                    </select>
                </div>

                {/* 胰島素注射狀態 */}
                <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">是否正在注射胰島素：</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setProfile({ ...profile, isInsulinUser: true })}
                            className={`p-2.5 rounded-xl border font-bold text-xs text-center cursor-pointer transition-all ${
                                profile.isInsulinUser 
                                    ? 'bg-amber-50 border-amber-400 text-amber-900 font-black shadow-xs' 
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                            💉 是，正在注射胰島素
                        </button>
                        <button
                            type="button"
                            onClick={() => setProfile({ ...profile, isInsulinUser: false })}
                            className={`p-2.5 rounded-xl border font-bold text-xs text-center cursor-pointer transition-all ${
                                !profile.isInsulinUser 
                                    ? 'bg-[#4A6E85] border-[#4A6E85] text-white font-black shadow-xs' 
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                            💊 否，未注射胰島素
                        </button>
                    </div>
                </div>

                {/* 📷 智能拍照識藥提醒與按鈕區 */}
                <div className="bg-gradient-to-r from-sky-50 to-blue-50/60 p-4 rounded-2xl border border-sky-200 space-y-3">
                    <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                            📷
                        </div>
                        <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                                <h4 className="text-xs sm:text-sm font-black text-slate-800">
                                    拍照掃描藥袋 / 藥盒
                                </h4>
                                <span className="text-[10px] bg-sky-600 text-white px-2 py-0.5 rounded-full font-bold">
                                    AI 自動識別
                                </span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-600 font-bold leading-relaxed">
                                您可以直接拍照或上傳醫院藥袋、藥盒標籤，AI 會自動為您識別藥物名稱，免去繁瑣打字！
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
                            className="bg-[#4A6E85] hover:bg-[#3d5b6e] text-white px-4 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60 active:scale-[0.99]"
                        >
                            {isScanningMed ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    <span>AI 正在辨識藥袋上的藥物資訊...</span>
                                </>
                            ) : (
                                <>
                                    <span>📸 拍照 / 上傳藥物照片</span>
                                </>
                            )}
                        </button>
                    </div>

                    {scanFeedback && (
                        <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-soft ${
                            scanFeedback.type === 'success'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                            <span>{scanFeedback.type === 'success' ? '✓' : '⚠️'}</span>
                            <span>{scanFeedback.message}</span>
                        </div>
                    )}
                </div>

                {/* 現有用藥清單 (同步香港 HA 英文資訊) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                            現時服用之糖尿專科藥物清單 (HA Drug Formulary)：
                        </label>
                        <span className="text-[11px] font-bold text-[#4A6E85]">
                            已登記 {profile.medicationDetails?.length || 0} 種藥物
                        </span>
                    </div>
                    
                    {profile.medicationDetails && profile.medicationDetails.length > 0 ? (
                        <div className="space-y-2">
                            {profile.medicationDetails.map((med, idx) => (
                                <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs">
                                    <div className="min-w-0 flex-grow">
                                        <p className="font-extrabold text-slate-800 truncate flex items-center gap-1.5">
                                            <span>💊</span>
                                            <span className="font-mono text-xs sm:text-sm text-[#3A5D75]">{med.name}</span>
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const next = profile.medicationDetails?.filter((_, i) => i !== idx);
                                            setProfile({ 
                                                ...profile, 
                                                medicationDetails: next,
                                                medications: (next || []).map(m => m.name).join('、')
                                            });
                                        }}
                                        className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg font-bold shrink-0 transition-colors cursor-pointer"
                                        title="刪除此藥物"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 font-bold py-2 text-center bg-slate-50 rounded-xl">
                            尚未登記任何糖尿專科藥物，可由下方手動選擇或自訂新增。
                        </p>
                    )}

                    {/* 手動選擇香港常見糖尿專科藥物 (同步香港 HA 醫管局藥物名冊，以英文為主顯示) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div className="relative">
                            <select
                                className="w-full bg-slate-50 p-2.5 rounded-xl font-bold text-xs text-[#4A6E85] outline-none border border-slate-200 hover:border-[#4A6E85]/20 appearance-none cursor-pointer"
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
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                        </div>

                        <div className="flex gap-1.5">
                            <input
                                placeholder="或輸入其他藥名 (英文/中文)..."
                                className="flex-1 bg-slate-50 p-2.5 rounded-xl text-xs font-bold text-slate-800 outline-none border border-slate-200 focus:bg-white focus:border-[#4A6E85]"
                                value={customMedName}
                                onChange={(e) => setCustomMedName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && customMedName.trim()) {
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
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => {
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
                                }}
                                disabled={!customMedName.trim()}
                                className={`px-3.5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                                    customMedName.trim()
                                        ? 'bg-[#4A6E85] text-white hover:bg-[#3d5b70] shadow-xs'
                                        : 'bg-slate-100 text-slate-400'
                                }`}
                            >
                                新增
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
