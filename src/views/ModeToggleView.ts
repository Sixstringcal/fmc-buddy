import { CubeNodeViewModel } from "../viewmodels/CubeNodeViewModel";
import { toggleMode } from "../actions/cubeNodeActions";
import { BLUE, ORANGE } from "../consts";
import { Button } from "../utils/ui";
import { Css } from "../models/css";
import { ModeText } from "../models/types";

export class ModeToggleView {
  private readonly _vm: CubeNodeViewModel;
  private readonly _btn: HTMLButtonElement;

  constructor(vm: CubeNodeViewModel) {
    this._vm = vm;
    this._btn = Button({ classes: `${Css.ButtonBase} ${Css.ToggleButton}`, onClick: () => toggleMode(this._vm) });
  }

  appendTo(parent: HTMLElement): void {
    parent.appendChild(this._btn);
  }

  bindObservables(): void {
    this._vm.isNormal.subscribe((normal) => {
      this._btn.textContent = normal ? ModeText.Normal : ModeText.Inverse;
      this._btn.style.backgroundColor = normal ? BLUE : ORANGE;
    });
  }
}
