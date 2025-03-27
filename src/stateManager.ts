export const saveState = (key: string, state: unknown): void => {
    localStorage.setItem(key, JSON.stringify(state));
};

export const loadState = <T>(key: string, defaultValue: T): T => {
    const savedState = localStorage.getItem(key);
    return savedState ? JSON.parse(savedState) as T : defaultValue;
};

export const clearLocalStorage = (): void => {
    const keys = Object.keys(localStorage);

    keys.forEach(key => {
        if (key.startsWith('cubeView_') ||
            key === 'scramble' ||
            key === 'cubeViewCount' ||
            key === 'cubeViewIds' ||
            key === 'cubeViewConnections') {
            localStorage.removeItem(key);
        }
    });
};
