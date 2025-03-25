export const saveState = (key: string, state: unknown): void => {
    localStorage.setItem(key, JSON.stringify(state));
};

export const loadState = <T>(key: string, defaultValue: T): T => {
    const savedState = localStorage.getItem(key);
    return savedState ? JSON.parse(savedState) as T : defaultValue;
};
