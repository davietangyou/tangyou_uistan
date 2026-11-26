import type {OnboardingViewModel} from './useOnboardingViewModel';

export function WelcomeHeader({vm}: {vm: OnboardingViewModel}) {
    const {isLargeFont} = vm;
    return (
        <>
            {/* 頂部歡迎區 */}
            <div className="text-center space-y-3 pt-4">
                <div className="inline-block w-20 h-20 bg-[#E8DED2]/40 rounded-3xl text-4xl flex items-center justify-center mb-2 shadow-inner">
                    👋
                </div>
                <h2 className={`font-black text-slate-900 tracking-tight ${isLargeFont ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'}`}>
                    歡迎來到「糖友導航」
                </h2>
                <p className={`text-slate-500 font-bold leading-relaxed ${isLargeFont ? 'text-lg' : 'text-sm sm:text-base'}`}>
                    首次使用只需填寫基本資料與長期疾病，即可量身打造個人化健康指引。
                </p>
            </div>
        </>
    );
}
