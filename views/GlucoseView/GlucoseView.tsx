import React from 'react';
import type {GlucoseViewProps} from './types';
import {useGlucoseViewModel} from './useGlucoseViewModel';
import {BloodGlucoseTab} from './BloodGlucoseTab';
import {SymptomTab} from './SymptomTab';
import {HbA1cTab} from './HbA1cTab';

export const GlucoseView: React.FC<GlucoseViewProps> = (props) => {
    const vm = useGlucoseViewModel(props);
    const {isLargeFont, activeTab, setActiveTab} = vm;

    return (
        <div className={`space-y-10 animate-soft pb-20 ${isLargeFont ? 'spacy-container' : ''}`}>
            {/* 顶部分段選擇器：柔和按鈕 */}
            <div className={`flex bg-slate-100/50 rounded-2xl ring-1 ring-slate-150 ${isLargeFont ? 'p-2' : 'p-1.5'}`}>
                <button 
                    onClick={() => setActiveTab('BG')}
                    className={`flex-grow font-black transition-all cursor-pointer ${isLargeFont ? 'py-5 text-xl rounded-xl' : 'py-3 text-sm rounded-xl'} ${activeTab === 'BG' ? 'bg-white shadow-md text-[#4A6E85]' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    🩸 血糖紀錄
                </button>
                <button 
                    onClick={() => setActiveTab('SYMPTOM')}
                    className={`flex-grow font-black transition-all cursor-pointer ${isLargeFont ? 'py-5 text-xl rounded-xl' : 'py-3 text-sm rounded-xl'} ${activeTab === 'SYMPTOM' ? 'bg-white shadow-md text-rose-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    🤒 症狀紀錄
                </button>
                <button 
                    onClick={() => setActiveTab('HBA1C')}
                    className={`flex-grow font-black transition-all cursor-pointer ${isLargeFont ? 'py-5 text-xl rounded-xl' : 'py-3 text-sm rounded-xl'} ${activeTab === 'HBA1C' ? 'bg-white shadow-md text-[#7FA0B4]' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    🧬 糖化
                </button>
            </div>

            {activeTab === 'BG' && (
                <BloodGlucoseTab vm={vm} />
            )}

            {activeTab === 'SYMPTOM' && (
                <SymptomTab vm={vm} />
            )}

            {activeTab === 'HBA1C' && (
                <HbA1cTab vm={vm} />
            )}
        </div>
    );
};
