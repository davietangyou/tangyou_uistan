export const formatDisplayDateTime = (dateObj: Date) => {
    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysZh = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    const dayEn = daysEn[dateObj.getDay()];
    const dayZh = daysZh[dateObj.getDay()];
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = dateObj.getFullYear();
    const hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return {
        en: `${dayEn}, ${dd}/${mm}/${yyyy}, ${hour12}:${minutes} ${ampm}`,
        zh: `${yyyy}年${mm}月${dd}日 (${dayZh}) ${String(hours).padStart(2, '0')}:${minutes}`,
        dateStr: `${yyyy}/${mm}/${dd} ${String(hours).padStart(2, '0')}:${minutes}`,
        isoForPicker: `${yyyy}-${mm}-${dd}T${String(hours).padStart(2, '0')}:${minutes}`
    };
};
