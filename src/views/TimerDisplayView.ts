import { TimerSnapshot } from "../models/types";
import { Span } from "../utils/ui";

export class TimerDisplayView {
  private readonly _span: HTMLSpanElement;

  constructor() {
    this._span = Span({ id: "timer-display" });
  }

  appendTo(parent: HTMLElement): void {
    parent.appendChild(this._span);
  }

  render(snap: TimerSnapshot): void {
    const minutes = Math.floor(snap.remainingSeconds / 60);
    const seconds = snap.remainingSeconds % 60;
    this._span.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
}
