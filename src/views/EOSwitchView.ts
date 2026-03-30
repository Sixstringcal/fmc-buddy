import { CubeNodeViewModel } from "../viewmodels/CubeNodeViewModel";
import { toggleEOView } from "../actions/cubeNodeActions";
import { Row, Span, Input, el } from "../utils/ui";

export class EOSwitchView {
  private readonly _wrapper: HTMLDivElement;
  private readonly _switchInput: HTMLInputElement;

  constructor(vm: CubeNodeViewModel) {
    this._switchInput = Input({
      type: "checkbox",
      classes: "eo-switch-checkbox",
      style: { display: "none" },
      on: { change: () => toggleEOView(vm) },
    });

    const eoSwitch = el("label", {
      classes: "eo-switch-outer",
      title: "Toggle EO View",
    },
      this._switchInput,
      Span({ classes: "eo-switch-slider" }),
    );

    this._wrapper = Row({ align: "center", style: { marginRight: "8px", height: "32px" } },
      Span({ text: "EO", classes: "eo-switch-label", style: { marginRight: "6px", fontWeight: "bold", fontSize: "1rem" } }),
      eoSwitch,
    );
  }

  getElement(): HTMLElement {
    return this._wrapper;
  }

  setChecked(checked: boolean): void {
    this._switchInput.checked = checked;
  }
}
