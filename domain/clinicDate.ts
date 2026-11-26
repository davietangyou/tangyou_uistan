/** Next-clinic date reminder relative to a local calendar day. */
export type DateReminderStatus = 'TODAY' | 'FUTURE' | 'PAST' | 'NONE';

export function clinicDateReminder(nextClinicDate: string, now: Date = new Date()): { status: DateReminderStatus; daysDiff: number } {
    let dateReminderStatus: DateReminderStatus = 'NONE';
    let daysDiff = 0;

    if (nextClinicDate) {
        const today = now;
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        if (nextClinicDate === todayStr) {
            dateReminderStatus = 'TODAY';
        } else {
            const targetDate = new Date(nextClinicDate + 'T00:00:00');
            const currentDate = new Date(todayStr + 'T00:00:00');
            const diffTime = targetDate.getTime() - currentDate.getTime();
            daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (daysDiff > 0) {
                dateReminderStatus = 'FUTURE';
            } else if (daysDiff < 0) {
                dateReminderStatus = 'PAST';
            }
        }
    }

    return { status: dateReminderStatus, daysDiff };
}
