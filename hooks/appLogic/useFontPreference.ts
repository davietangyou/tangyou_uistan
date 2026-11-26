import {useEffect, useState} from 'react';

export function useFontPreference() {
    // 7. Accessibility State (老友大字模式 / 護眼大字體色調)
    const [isLargeFont, setIsLargeFont] = useState<boolean>(() => {
        const saved = localStorage.getItem('dia_large_font');
        return saved ? saved === 'true' : true; // 預設開啟大字護老模式
    });

    useEffect(() => localStorage.setItem('dia_large_font', String(isLargeFont)), [isLargeFont]);

    return {isLargeFont, setIsLargeFont};
}
