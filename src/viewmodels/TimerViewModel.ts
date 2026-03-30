import { Observable } from "../core/Observable";
import { ViewModel } from "../core/ViewModel";
import { TimerSnapshot, TimerStatus } from "../models/types";

export class TimerViewModel extends ViewModel {
    private readonly _totalSeconds: number;
    private _remainingSeconds: number;
    private _status: TimerStatus = "idle";
    private _intervalId: ReturnType<typeof setInterval> | null = null;

    readonly snapshot: Observable<TimerSnapshot>;

    onExpired: (() => void) | null = null;

    constructor(totalSeconds: number) {
        super();
        this._totalSeconds = totalSeconds;
        this._remainingSeconds = totalSeconds;
        this.snapshot = new Observable<TimerSnapshot>(this._buildSnapshot());

        this.addDisposable(() => this._clearInterval());
    }

    start(): void {
        if (this._status === "running" || this._remainingSeconds === 0) return;
        this._status = "running";
        this._intervalId = setInterval(() => this._tick(), 1_000);
        this._emit();
    }

    pause(): void {
        if (this._status !== "running") return;
        this._clearInterval();
        this._status = "paused";
        this._emit();
    }

    toggle(): void {
        this._status === "running" ? this.pause() : this.start();
    }

    reset(): void {
        this._clearInterval();
        this._remainingSeconds = this._totalSeconds;
        this._status = "idle";
        this._emit();
    }

    private _tick(): void {
        if (this._remainingSeconds > 0) {
            this._remainingSeconds--;
            this._emit();
        }
        if (this._remainingSeconds === 0) {
            this._clearInterval();
            this._status = "expired";
            this._emit();
            this.onExpired?.();
        }
    }

    private _clearInterval(): void {
        if (this._intervalId !== null) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
    }

    private _buildSnapshot(): TimerSnapshot {
        const minutes = Math.floor(this._remainingSeconds / 60);
        const seconds = this._remainingSeconds % 60;
        return {
            remainingSeconds: this._remainingSeconds,
            totalSeconds: this._totalSeconds,
            status: this._status,
            displayTime: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
            playPauseState: this._status === "running" ? "pause" : "play",
            showRestart: this._remainingSeconds < this._totalSeconds,
        };
    }

    private _emit(): void {
        this.snapshot.set(this._buildSnapshot());
    }
}
