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

export enum TimerStatus {
    Idle    = "idle",
    Running = "running",
    Paused  = "paused",
    Expired = "expired",
}

export enum PlayPauseState {
    Play  = "play",
    Pause = "pause",
}

export interface TimerSnapshot {
    readonly remainingSeconds: number;
    readonly totalSeconds: number;
    readonly status: TimerStatus;
    /** Pre-formatted MM:SS string ready for display. */
    readonly displayTime: string;
    /** Whether the play/pause button should show "pause" (currently running) or "play". */
    readonly playPauseState: PlayPauseState;
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

// ---------------------------------------------------------------------------
// Shared UI enums (display values, keyboard keys, asset paths, colours)
// ---------------------------------------------------------------------------

export enum Display {
    None        = "none",
    Default     = "",
    Block       = "block",
    InlineBlock = "inline-block",
}

export enum Key {
    Enter  = "Enter",
    Escape = "Escape",
}

export enum Asset {
    PlaySvg    = "/assets/play.svg",
    PauseSvg   = "/assets/pause.svg",
    RestartSvg = "/assets/restart.svg",
}

export enum BgColor {
    Good = "lightgreen",
    Bad  = "lightcoral",
    None = "",
}

// ---------------------------------------------------------------------------
// CubeView
// ---------------------------------------------------------------------------

export enum CubeViewIcon {
    Drag     = "&#x2807;",
    Minimize = "\u2212",
    Maximize = "+",
    Delete   = "\u00d7",
}

export enum CubeViewText {
    DeleteTitle   = "Delete this cube view",
    DeleteConfirm = "Are you sure you want to delete this cube view?",
}

// ---------------------------------------------------------------------------
// CubeInputView
// ---------------------------------------------------------------------------

export enum CubeInputText {
    DuplicateIcon  = "+",
    DuplicateTitle = "Duplicate this cube view",
    FinishIcon     = "\u2714",
    FinishTitle    = "Finish this cube view",
}

// ---------------------------------------------------------------------------
// ScrambleRefreshButtonView
// ---------------------------------------------------------------------------

export enum ScrambleRefreshText {
    FallbackIcon   = "\u21ba",
    Title          = "New scramble / Reset all",
    ConfirmRestart = "Are you sure you want to restart?",
}

// ---------------------------------------------------------------------------
// ScrambleInverseView
// ---------------------------------------------------------------------------

export enum ScrambleInverseText {
    Show   = "Show inverse",
    Hide   = "Hide inverse",
    Title  = "Toggle inverse scramble",
    Prefix = "Inverse: ",
}

// ---------------------------------------------------------------------------
// MoveCounterView
// ---------------------------------------------------------------------------

export enum MoveCounterText {
    Prefix = "Moves: ",
}

// ---------------------------------------------------------------------------
// RatingButtonsView
// ---------------------------------------------------------------------------

export enum RatingIcon {
    ThumbsUp   = "\uD83D\uDC4D",
    ThumbsDown = "\uD83D\uDC4E",
}

// ---------------------------------------------------------------------------
// ModeToggleView
// ---------------------------------------------------------------------------

export enum ModeText {
    Normal  = "Normal",
    Inverse = "Inverse",
}

// ---------------------------------------------------------------------------
// ScrambleEditView
// ---------------------------------------------------------------------------

export enum ScrambleEditIcon {
    Edit   = "\u270F\uFE0F",
    Commit = "\u2714\uFE0F",
}

// ---------------------------------------------------------------------------
// EOSwitchView
// ---------------------------------------------------------------------------

export enum EOSwitchText {
    Label  = "EO",
    Title  = "Toggle EO View",
}

// ---------------------------------------------------------------------------
// EOListView
// ---------------------------------------------------------------------------

export enum EOListText {
    Placeholder = "(Double click to edit)",
    AddIcon     = "+",
    AddTitle    = "Add EO",
}
