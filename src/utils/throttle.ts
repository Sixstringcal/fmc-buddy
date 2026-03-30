export function throttle<Args extends unknown[]>(
    fn: (...args: Args) => void,
    delay: number,
): (...args: Args) => void {
    let lastCall = 0;
    return (...args: Args): void => {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            fn(...args);
        }
    };
}
