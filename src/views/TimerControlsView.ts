import { TimerViewModel } from "../viewmodels/TimerViewModel";
import { toggleTimer, resetTimer } from "../actions/timerActions";
import { TimerSnapshot } from "../models/types";
import { loadSvg } from "../utils/svgLoader";

export class TimerControlsView {
  private readonly _playPauseBtn: HTMLButtonElement;
  private readonly _restartBtn: HTMLButtonElement;

  constructor(vm: TimerViewModel) {
    this._playPauseBtn = document.createElement("button");
    this._playPauseBtn.id = "timer-button";
    this._playPauseBtn.classList.add("timer-button");
    this._playPauseBtn.addEventListener("click", () => toggleTimer(vm));

    this._restartBtn = document.createElement("button");
    this._restartBtn.id = "restart-button";
    this._restartBtn.classList.add("timer-button");
    this._restartBtn.style.display = "none";
    this._restartBtn.addEventListener("click", () => resetTimer(vm));
  }

  appendTo(parent: HTMLElement): void {
    parent.appendChild(this._playPauseBtn);
    parent.appendChild(this._restartBtn);
  }

  async loadIcons(): Promise<void> {
    const [playSvg, pauseSvg, restartSvg] = await Promise.all([
      loadSvg("/assets/play.svg"),
      loadSvg("/assets/pause.svg"),
      loadSvg("/assets/restart.svg"),
    ]);
    this._playPauseBtn.dataset["playSvg"] = playSvg;
    this._playPauseBtn.dataset["pauseSvg"] = pauseSvg;
    this._restartBtn.innerHTML = restartSvg;
  }

  render(snap: TimerSnapshot): void {
    const playSvg = this._playPauseBtn.dataset["playSvg"] ?? "";
    const pauseSvg = this._playPauseBtn.dataset["pauseSvg"] ?? "";
    this._playPauseBtn.innerHTML = snap.status === "running" ? pauseSvg : playSvg;
    this._restartBtn.style.display =
      snap.remainingSeconds < snap.totalSeconds ? "inline-block" : "none";
  }
}
