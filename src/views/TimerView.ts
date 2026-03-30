import { TimerViewModel } from "../viewmodels/TimerViewModel";
import { toggleTimer, resetTimer } from "../actions/timerActions";
import { TimerSnapshot } from "../models/types";
import { loadSvg } from "../utils/svgLoader";

export class TimerView {
    private readonly _vm: TimerViewModel;
    private _container!: HTMLElement;
    private _display!: HTMLElement;
    private _playPauseBtn!: HTMLButtonElement;
    private _restartBtn!: HTMLButtonElement;

    constructor(vm: TimerViewModel) {
        this._vm = vm;
        this._buildDOM();
        this._loadIcons().then(() => this._bindObservables());

        this._positionBelowScramble();
        window.addEventListener("resize", () => this._positionBelowScramble());
    }

    getElement(): HTMLElement {
        return this._container;
    }

    private _buildDOM(): void {
        this._container = document.createElement("div");
        this._container.id = "countdown-timer";
        this._container.classList.add("countdown-timer");

        this._display = document.createElement("span");
        this._display.id = "timer-display";
        this._container.appendChild(this._display);

        this._playPauseBtn = document.createElement("button");
        this._playPauseBtn.id = "timer-button";
        this._playPauseBtn.classList.add("timer-button");
        this._playPauseBtn.addEventListener("click", () => toggleTimer(this._vm));
        this._container.appendChild(this._playPauseBtn);

        this._restartBtn = document.createElement("button");
        this._restartBtn.id = "restart-button";
        this._restartBtn.classList.add("timer-button");
        this._restartBtn.style.display = "none";
        this._restartBtn.addEventListener("click", () => resetTimer(this._vm));
        this._container.appendChild(this._restartBtn);
    }

    private async _loadIcons(): Promise<void> {
        const [playSvg, pauseSvg, restartSvg] = await Promise.all([
            loadSvg("/assets/play.svg"),
            loadSvg("/assets/pause.svg"),
            loadSvg("/assets/restart.svg"),
        ]);

        this._playPauseBtn.dataset["playSvg"] = playSvg;
        this._playPauseBtn.dataset["pauseSvg"] = pauseSvg;
        this._restartBtn.innerHTML = restartSvg;
        this._render(this._vm.snapshot.get());
    }

    private _bindObservables(): void {
        this._vm.snapshot.subscribe((snap) => this._render(snap));
    }

    private _render(snap: TimerSnapshot): void {
        const minutes = Math.floor(snap.remainingSeconds / 60);
        const seconds = snap.remainingSeconds % 60;
        this._display.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

        const playSvg = this._playPauseBtn.dataset["playSvg"] ?? "";
        const pauseSvg = this._playPauseBtn.dataset["pauseSvg"] ?? "";
        this._playPauseBtn.innerHTML = snap.status === "running" ? pauseSvg : playSvg;

        this._restartBtn.style.display =
            snap.remainingSeconds < snap.totalSeconds ? "inline-block" : "none";
    }

    private _positionBelowScramble(): void {
        const scramble = document.getElementById("scramble-container");
        if (!scramble) return;

        const sr = scramble.getBoundingClientRect();
        const tr = this._container.getBoundingClientRect();

        const overlapping = !(
            tr.top > sr.bottom ||
            tr.right < sr.left ||
            tr.bottom < sr.top ||
            tr.left > sr.right
        );

        this._container.style.marginTop = overlapping
            ? `${sr.height + 10}px`
            : "0px";
    }
}
