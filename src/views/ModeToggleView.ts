import { CubeNodeViewModel } from "../viewmodels/CubeNodeViewModel";
import { toggleMode } from "../actions/cubeNodeActions";
import { BLUE, ORANGE } from "../consts";

export class ModeToggleView {
  private readonly _vm: CubeNodeViewModel;
  private readonly _btn: HTMLButtonElement;

  constructor(vm: CubeNodeViewModel) {
    this._vm = vm;
    this._btn = document.createElement("button");
    this._btn.id = `${vm.id}-toggle-button`;
    this._btn.classList.add("toggle-button", "button");
    this._btn.addEventListener("click", () => toggleMode(this._vm));
  }

  appendTo(parent: HTMLElement): void {
    parent.appendChild(this._btn);
  }

  bindObservables(): void {
    this._vm.isNormal.subscribe((normal) => {
      this._btn.textContent = normal ? "Normal" : "Inverse";
      this._btn.style.backgroundColor = normal ? BLUE : ORANGE;
    });
  }
}
