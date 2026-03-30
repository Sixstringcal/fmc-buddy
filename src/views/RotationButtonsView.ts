import { CubeNodeViewModel } from "../viewmodels/CubeNodeViewModel";
import { setSecretRotation } from "../actions/cubeNodeActions";
import { BLUE } from "../consts";
import { Div, Button } from "../utils/ui";
import { Css } from "../models/css";

const ROTATIONS: Array<{ label: string; key: string }> = [
  { label: "x",  key: "x"  },
  { label: "x'", key: "x'" },
  { label: "z",  key: "z"  },
  { label: "z'", key: "z'" },
];

export class RotationButtonsView {
  private readonly _vm: CubeNodeViewModel;
  private readonly _container: HTMLDivElement;
  private readonly _btns = new Map<string, HTMLButtonElement>();

  constructor(vm: CubeNodeViewModel) {
    this._vm = vm;

    this._container = Div({ classes: Css.RotationContainer });

    for (const { label, key } of ROTATIONS) {
      const btn = Button({ text: label, classes: `${Css.ButtonBase} ${Css.RotationButton}`, onClick: () => setSecretRotation(this._vm, key) });
      this._btns.set(key, btn);
      this._container.appendChild(btn);
    }
  }

  appendTo(parent: HTMLElement): void {
    parent.appendChild(this._container);
  }

  bindObservables(): void {
    this._vm.secretRotation.subscribe((active) => {
      for (const [key, btn] of this._btns) {
        if (key === active) {
          btn.style.backgroundColor = BLUE;
          btn.style.color = "white";
        } else {
          btn.style.backgroundColor = "";
          btn.style.color = BLUE;
        }
      }
    });
  }
}
