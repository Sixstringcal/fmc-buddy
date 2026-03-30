import { CubeNodeViewModel } from "../viewmodels/CubeNodeViewModel";
import { toggleEOView } from "../actions/cubeNodeActions";

export class EOSwitchView {
  private readonly _id: string;
  private readonly _wrapper: HTMLDivElement;

  constructor(vm: CubeNodeViewModel) {
    this._id = vm.id;

    this._wrapper = document.createElement("div");
    this._wrapper.style.cssText = "display:flex;align-items:center;margin-right:8px;height:32px;";

    const label = document.createElement("span");
    label.textContent = "EO";
    label.className = "eo-switch-label";
    label.style.cssText = "margin-right:6px;font-weight:bold;font-size:1rem;";
    this._wrapper.appendChild(label);

    const eoSwitch = document.createElement("label");
    eoSwitch.id = `${this._id}-eo-switch`;
    eoSwitch.className = "eo-switch-outer";
    eoSwitch.title = "Toggle EO View";
    eoSwitch.innerHTML = `<input type="checkbox" class="eo-switch-checkbox" style="display:none;"><span class="eo-switch-slider"></span>`;
    eoSwitch.querySelector("input")!.addEventListener("change", () => toggleEOView(vm));
    this._wrapper.appendChild(eoSwitch);
  }

  getElement(): HTMLElement {
    return this._wrapper;
  }

  setChecked(checked: boolean): void {
    const el = document.getElementById(`${this._id}-eo-switch`);
    if (el) (el.querySelector("input") as HTMLInputElement).checked = checked;
  }
}
