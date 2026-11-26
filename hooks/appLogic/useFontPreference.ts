import {useEffect, useState} from 'react';
import {loadLargeFontPreference, persistLargeFontPreference} from '../../domain';

export function useFontPreference() {
    // 7. Accessibility State (老友大字模式 / 護眼大字體色調)
    const [isLargeFont, setIsLargeFont] = useState<boolean>(() => loadLargeFontPreference());

    useEffect(() => persistLargeFontPreference(isLargeFont), [isLargeFont]);

    return {isLargeFont, setIsLargeFont};
}
