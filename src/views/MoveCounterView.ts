import { CubeNodeViewModel } from "../viewmodels/CubeNodeViewModel";

export class MoveCounterView {
  private readonly _vm: CubeNodeViewModel;
  private readonly _el: HTMLDivElement;

  constructor(vm: CubeNodeViewModel) {
    this._vm = vm;
    this._el = document.createElement("div");
    this._el.id = `${vm.id}-move-counter`;
    this._el.classList.add("move-counter");
    this._el.textContent = "Moves: 0";
  }

  appendTo(parent: HTMLElement): void {
    parent.appendChild(this._el);
  }

  getElement(): HTMLDivElement {
    return this._el;
  }

  bindObservables(): void {
    this._vm.moveCount.subscribe((count) => {
      this._el.textContent = `Moves: ${count}`;
    });
  }
}
