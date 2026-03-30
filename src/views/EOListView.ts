import { CubeNodeViewModel } from "../viewmodels/CubeNodeViewModel";
import { Div, Button, Input } from "../utils/ui";
import {
  addEOEntry,
  selectEO,
  updateEOEntry,
  updateTextboxDimensions,
} from "../actions/cubeNodeActions";
import { EO_SELECTED_BG } from "../consts";
import { EOSwitchView } from "./EOSwitchView";

export class EOListView {
  private readonly _vm: CubeNodeViewModel;
  private readonly _id: string;
  private _eoSwitch!: EOSwitchView;
  private _wrapper: HTMLDivElement | null = null;
  private _onPreview: ((alg: string) => void) | undefined;

  constructor(vm: CubeNodeViewModel) {
    this._vm = vm;
    this._id = vm.id;
  }

  createSwitchWrapper(): HTMLElement {
    this._eoSwitch = new EOSwitchView(this._vm);
    return this._eoSwitch.getElement();
  }

  createListWrapper(): HTMLDivElement {
    this._wrapper = Div({
      classes: "eo-list-wrapper",
      style: { display: "none" },
      on: {
        mouseup: () => updateTextboxDimensions(this._vm, this._wrapper!.offsetWidth, this._wrapper!.offsetHeight),
        touchend: () => updateTextboxDimensions(this._vm, this._wrapper!.offsetWidth, this._wrapper!.offsetHeight),
      },
    });
    return this._wrapper;
  }

  toggle(isEO: boolean, textarea: HTMLTextAreaElement, counter: HTMLElement): void {
    if (isEO) {
      textarea.style.display = "none";
      if (this._wrapper) this._wrapper.style.display = "";
      this._eoSwitch.setChecked(true);
      counter.style.display = "none";
      if (this._vm.eoList.get().length === 0) addEOEntry(this._vm);
    } else {
      textarea.style.display = "";
      if (this._wrapper) this._wrapper.style.display = "none";
      this._eoSwitch.setChecked(false);
      counter.style.display = "";
    }

    this.render();
  }

  render(): void {
    const wrapper = this._wrapper;
    if (!wrapper) return;
    if (wrapper.querySelector(".eo-edit-input")) return;
    wrapper.innerHTML = "";
    if (!this._vm.isEOView.get()) return;

    const indexed = this._vm.sortedEOList.get();
    const selectedIdx = this._vm.selectedEOIndex.get();

    for (let rank = 0; rank < indexed.length; rank++) {
      const { eo, idx } = indexed[rank];
      const row = Div({
        classes: "eo-row",
        text: eo || "(Double click to edit)",
        title: eo,
        style: idx === selectedIdx ? { background: EO_SELECTED_BG } : {},
      });

      const capturedRank = rank;
      let clickTimeout: ReturnType<typeof setTimeout> | null = null;
      row.addEventListener("click", () => {
        if (clickTimeout !== null) {
          clearTimeout(clickTimeout);
          clickTimeout = null;
          this._editRow(idx, capturedRank, wrapper);
        } else {
          clickTimeout = setTimeout(() => {
            selectEO(this._vm, idx);
            clickTimeout = null;
          }, 200);
        }
      });
      wrapper.appendChild(row);
    }

    wrapper.appendChild(
      Div({ classes: "eo-add-row" },
        Button({ text: "+", title: "Add EO", classes: "eo-add-button", onClick: () => addEOEntry(this._vm) }),
      ),
    );
  }

  bindObservables(
    textarea: HTMLTextAreaElement,
    counter: HTMLElement,
    onPreview?: (alg: string) => void,
  ): void {
    this._onPreview = onPreview;
    this._vm.isEOView.subscribe((isEO) => this.toggle(isEO, textarea, counter));
    const renderEO = () => this.render();
    this._vm.sortedEOList.subscribe(renderEO);
    this._vm.selectedEOIndex.subscribe(renderEO);
  }

  private _editRow(idx: number, rank: number, wrapper: HTMLElement): void {
    const input = Input({ type: "text", value: this._vm.eoList.get()[idx] ?? "", classes: "eo-edit-input" });
    let cancelled = false;

    input.addEventListener("input", () => {
      if (this._onPreview) {
        this._onPreview(this._vm.computePreviewAlg(input.value));
      }
    });

    input.addEventListener("blur", () => {
      if (!cancelled) updateEOEntry(this._vm, idx, input.value);
      input.classList.remove("eo-edit-input");
      this.render();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") input.blur();
      if (e.key === "Escape") {
        cancelled = true;
        input.blur();
      }
    });

    const rows = wrapper.querySelectorAll(".eo-row");
    if (rows[rank]) wrapper.replaceChild(input, rows[rank]);
    input.focus();
  }
}
