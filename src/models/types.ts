export type Scramble = string;

export interface CubeNodeState {
    readonly id: string;
    moves: string;
    position: { left: number; top: number };
    isMinimized: boolean;
    isNormal: boolean;
    secretRotation: string;
    isGood: boolean | null;
    textboxDimensions?: { width: number; height: number };
    isEOView: boolean;
    eoList: string[];
    selectedEOIndex: number;
}

export function createDefaultCubeNodeState(id: string): CubeNodeState {
    return {
        id,
        moves: "",
        position: { left: 100, top: 100 },
        isMinimized: false,
        isNormal: true,
        secretRotation: "",
        isGood: null,
        textboxDimensions: undefined,
        isEOView: false,
        eoList: [],
        selectedEOIndex: 0,
    };
}

export interface ConnectionRecord {
    readonly sourceId: string;
    readonly targetId: string;
}

export type TimerStatus = "idle" | "running" | "paused" | "expired";

export interface TimerSnapshot {
    readonly remainingSeconds: number;
    readonly totalSeconds: number;
    readonly status: TimerStatus;
}

export const APP_STATE_KEYS = {
    scramble: "scramble",
    cubeViewCount: "cubeViewCount",
    cubeViewIds: "cubeViewIds",
    cubeViewConnections: "cubeViewConnections",
    cubeViewPrefix: "cubeView_",
} as const;
