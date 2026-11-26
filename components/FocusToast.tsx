export function FocusToast() {
    return (
        <div
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-8 py-4 rounded-full shadow-2xl font-bold flex items-center gap-3 animate-in slide-in-from-top-4">
            <span className="text-2xl">☝️</span>
            <span>請先點擊一下您想要輸入的空格</span>
        </div>
    );
}
