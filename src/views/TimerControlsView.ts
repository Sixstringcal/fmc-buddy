import { TimerViewModel } from "../viewmodels/TimerViewModel";
import { toggleTimer, resetTimer } from "../actions/timerActions";
import { TimerSnapshot } from "../models/types";
import { loadSvg } from "../utils/svgLoader";
import { Button } from "../utils/ui";

export class TimerControlsView {
  private readonly _playPauseBtn: HTMLButtonElement;
  private readonly _restartBtn: HTMLButtonElement;

  constructor(vm: TimerViewModel) {
    this._playPauseBtn = Button({ classes: "timer-button", onClick: () => toggleTimer(vm) });
    this._restartBtn = Button({ classes: "timer-button", style: { display: "none" }, onClick: () => resetTimer(vm) });
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
