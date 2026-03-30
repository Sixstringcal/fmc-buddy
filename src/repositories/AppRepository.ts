import { APP_STATE_KEYS, ConnectionRecord, CubeNodeState } from "../models/types";

function load<T>(key: string, fallback: T): T {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function save(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
}

export const AppRepository = {

    loadScramble(): string {
        return load<string>(APP_STATE_KEYS.scramble, "");
    },

    saveScramble(scramble: string): void {
        save(APP_STATE_KEYS.scramble, scramble);
    },

    loadCubeNodeIds(): string[] {
        return load<string[]>(APP_STATE_KEYS.cubeViewIds, []);
    },

    saveCubeNodeIds(ids: string[]): void {
        save(APP_STATE_KEYS.cubeViewIds, ids);
        save(APP_STATE_KEYS.cubeViewCount, ids.length);
    },

    loadCubeNodeState(id: string): CubeNodeState | null {
        return load<CubeNodeState | null>(`${APP_STATE_KEYS.cubeViewPrefix}${id}`, null);
    },

    saveCubeNodeState(state: CubeNodeState): void {
        save(`${APP_STATE_KEYS.cubeViewPrefix}${state.id}`, state);
    },

    deleteCubeNodeState(id: string): void {
        localStorage.removeItem(`${APP_STATE_KEYS.cubeViewPrefix}${id}`);
    },

    loadConnections(): ConnectionRecord[] {
        return load<ConnectionRecord[]>(APP_STATE_KEYS.cubeViewConnections, []);
    },

    saveConnections(connections: ConnectionRecord[]): void {
        save(APP_STATE_KEYS.cubeViewConnections, connections);
    },

    clearAll(): void {
        const toRemove = Object.keys(localStorage).filter(
            (key) =>
                key.startsWith(APP_STATE_KEYS.cubeViewPrefix) ||
                key === APP_STATE_KEYS.scramble ||
                key === APP_STATE_KEYS.cubeViewCount ||
                key === APP_STATE_KEYS.cubeViewIds ||
                key === APP_STATE_KEYS.cubeViewConnections,
        );
        for (const key of toRemove) {
            localStorage.removeItem(key);
        }
    },
} as const;
