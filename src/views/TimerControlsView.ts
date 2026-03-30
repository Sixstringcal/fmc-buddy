import { TimerViewModel } from "../viewmodels/TimerViewModel";
import { toggleTimer, resetTimer } from "../actions/timerActions";
import { Asset, Display, PlayPauseState, TimerSnapshot } from "../models/types";
import { Css } from "../models/css";
import { loadSvg } from "../utils/svgLoader";
import { Button } from "../utils/ui";

export class TimerControlsView {
  private readonly _playPauseBtn: HTMLButtonElement;
  private readonly _restartBtn: HTMLButtonElement;

  constructor(vm: TimerViewModel) {
    this._playPauseBtn = Button({ classes: Css.TimerButton, onClick: () => toggleTimer(vm) });
    this._restartBtn = Button({ classes: Css.TimerButton, style: { display: Display.None }, onClick: () => resetTimer(vm) });
  }

  appendTo(parent: HTMLElement): void {
    parent.appendChild(this._playPauseBtn);
    parent.appendChild(this._restartBtn);
  }

  async loadIcons(): Promise<void> {
    const [playSvg, pauseSvg, restartSvg] = await Promise.all([
      loadSvg(Asset.PlaySvg),
      loadSvg(Asset.PauseSvg),
      loadSvg(Asset.RestartSvg),
    ]);
    this._playPauseBtn.dataset["playSvg"] = playSvg;
    this._playPauseBtn.dataset["pauseSvg"] = pauseSvg;
    this._restartBtn.innerHTML = restartSvg;
  }

  render(snap: TimerSnapshot): void {
    const playSvg = this._playPauseBtn.dataset["playSvg"] ?? "";
    const pauseSvg = this._playPauseBtn.dataset["pauseSvg"] ?? "";
    this._playPauseBtn.innerHTML = snap.playPauseState === PlayPauseState.Pause ? pauseSvg : playSvg;
    this._restartBtn.style.display = snap.showRestart ? Display.InlineBlock : Display.None;
  }
}
