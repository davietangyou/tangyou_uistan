import type {GlucoseViewModel} from '../useGlucoseViewModel';

// Stage 6 pure move from BloodGlucoseTab/SymptomTab (lines 69-77 / 50-58); JSX copied verbatim.
export function SaveSuccessBanner({vm, syncHint}: {vm: GlucoseViewModel; syncHint: string}) {
    const {
        saveSuccessMessage
    } = vm;

    return (
        <>
                    {saveSuccessMessage && (
                        <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-2xl flex items-center gap-3 shadow-md animate-bounce">
                            <span className="text-2xl">✅</span>
                            <div className="flex-grow">
                                <p className="font-black text-emerald-800 text-sm sm:text-base">{saveSuccessMessage}</p>
                                <p className="text-emerald-600 font-bold text-xs">{syncHint}</p>
                            </div>
                        </div>
                    )}
        </>
    );
}
