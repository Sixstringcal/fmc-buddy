import { CubeNodeViewModel } from "../viewmodels/CubeNodeViewModel";
import { Div } from "../utils/ui";
import { Css } from "../models/css";
import { MoveCounterText } from "../models/types";

export class MoveCounterView {
  private readonly _vm: CubeNodeViewModel;
  private readonly _el: HTMLDivElement;

  constructor(vm: CubeNodeViewModel) {
    this._vm = vm;
    this._el = Div({ classes: Css.MoveCounter, text: `${MoveCounterText.Prefix}0` });
  }

  appendTo(parent: HTMLElement): void {
    parent.appendChild(this._el);
  }

  getElement(): HTMLDivElement {
    return this._el;
  }

  bindObservables(): void {
    this._vm.moveCount.subscribe((count) => {
      this._el.textContent = `${MoveCounterText.Prefix}${count}`;
    });
  }
}
