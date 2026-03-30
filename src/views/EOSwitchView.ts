import { CubeNodeViewModel } from "../viewmodels/CubeNodeViewModel";
import { toggleEOView } from "../actions/cubeNodeActions";
import { Row, Span, Input, el } from "../utils/ui";
import { Css } from "../models/css";
import { EOSwitchText } from "../models/types";
import { Spacing } from "../consts";

export class EOSwitchView {
  private readonly _wrapper: HTMLDivElement;
  private readonly _switchInput: HTMLInputElement;

  constructor(vm: CubeNodeViewModel) {
    this._switchInput = Input({
      type: "checkbox",
      classes: Css.EoSwitchCheckbox,
      style: { display: "none" },
      on: { change: () => toggleEOView(vm) },
    });

    const eoSwitch = el("label", {
      classes: Css.EoSwitchOuter,
      title: EOSwitchText.Title,
    },
      this._switchInput,
      Span({ classes: Css.EoSwitchSlider }),
    );

    this._wrapper = Row({ align: "center", style: { marginRight: Spacing.SM, height: "32px" } },
      Span({ text: EOSwitchText.Label, classes: Css.EoSwitchLabel, style: { marginRight: Spacing.XS, fontWeight: "bold", fontSize: "1rem" } }),
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
