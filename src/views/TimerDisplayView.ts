import { TimerSnapshot } from "../models/types";
import { Span } from "../utils/ui";

export class TimerDisplayView {
  private readonly _span: HTMLSpanElement;

  constructor() {
    this._span = Span();
  }

  appendTo(parent: HTMLElement): void {
    parent.appendChild(this._span);
  }

  render(snap: TimerSnapshot): void {
    this._span.textContent = snap.displayTime;
  }
}
