import { CubeNodeViewModel } from "../viewmodels/CubeNodeViewModel";
import { setSecretRotation } from "../actions/cubeNodeActions";
import { BLUE } from "../consts";

const ROTATIONS: Array<{ label: string; key: string }> = [
  { label: "x", key: "x" },
  { label: "x'", key: "x'" },
  { label: "z", key: "z" },
  { label: "z'", key: "z'" },
];

export class RotationButtonsView {
  private readonly _vm: CubeNodeViewModel;
  private readonly _id: string;
  private readonly _container: HTMLDivElement;

  constructor(vm: CubeNodeViewModel) {
    this._vm = vm;
    this._id = vm.id;

    this._container = document.createElement("div");
    this._container.id = `${this._id}-rotation-buttons`;
    this._container.classList.add("rotation-button-container");

    for (const { label, key } of ROTATIONS) {
      const btn = document.createElement("button");
      btn.id = `${this._id}-rotation-${label.replace("'", "prime")}-button`;
      btn.textContent = label;
      btn.classList.add("rotation-button", "button");
      btn.addEventListener("click", () => setSecretRotation(this._vm, key));
      this._container.appendChild(btn);
    }
  }

  appendTo(parent: HTMLElement): void {
    parent.appendChild(this._container);
  }

  bindObservables(): void {
    const idMap: Record<string, string> = {
      x: `${this._id}-rotation-x-button`,
      "x'": `${this._id}-rotation-xprime-button`,
      z: `${this._id}-rotation-z-button`,
      "z'": `${this._id}-rotation-zprime-button`,
    };

    this._vm.secretRotation.subscribe((active) => {
      for (const [key, btnId] of Object.entries(idMap)) {
        const btn = document.getElementById(btnId) as HTMLButtonElement | null;
        if (!btn) continue;
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
