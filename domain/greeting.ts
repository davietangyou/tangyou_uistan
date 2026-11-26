/** Time-of-day greeting in zh-HK. Hour is 0-23 local time. */
export function timeOfDayGreeting(hour: number): string {
    let timeGreeting = "你好";

    if (hour >= 5 && hour < 12) timeGreeting = "早安";
    else if (hour >= 12 && hour < 18) timeGreeting = "午安";
    else if (hour >= 18 || hour < 5) timeGreeting = "晚安";

    return timeGreeting;
}

export function personalGreeting(name: string | undefined, hour: number): string {
    const userName = name || "老友記";
    return `${userName}，${timeOfDayGreeting(hour)}`;
}
