/** BMI from height (cm) and weight (kg or lb). Empty string if inputs are not usable. */
export const calculateBmi = (height: string, weight: string, unit: 'kg' | 'lb' = 'kg') => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!isNaN(h) && h > 0 && !isNaN(w) && w > 0) {
        const wKg = unit === 'lb' ? w * 0.45359237 : w;
        return (wKg / Math.pow(h / 100, 2)).toFixed(1);
    }
    return '';
};
