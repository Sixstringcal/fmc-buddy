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
    /** Pre-formatted MM:SS string ready for display. */
    readonly displayTime: string;
    /** Whether the play/pause button should show "pause" (currently running) or "play". */
    readonly playPauseState: "play" | "pause";
    /** Whether the restart button should be visible (timer has been started at least once). */
    readonly showRestart: boolean;
}

export const APP_STATE_KEYS = {
    scramble: "scramble",
    cubeViewCount: "cubeViewCount",
    cubeViewIds: "cubeViewIds",
    cubeViewConnections: "cubeViewConnections",
    cubeViewPrefix: "cubeView_",
} as const;
