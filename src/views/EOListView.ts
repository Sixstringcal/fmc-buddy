import { CubeNodeViewModel } from "../viewmodels/CubeNodeViewModel";
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
    const wrapper = document.createElement("div");
    wrapper.id = `${this._id}-eo-list-wrapper`;
    wrapper.className = "eo-list-wrapper";
    wrapper.style.display = "none";

    wrapper.addEventListener("mouseup", () =>
      updateTextboxDimensions(this._vm, wrapper.offsetWidth, wrapper.offsetHeight),
    );
    wrapper.addEventListener("touchend", () =>
      updateTextboxDimensions(this._vm, wrapper.offsetWidth, wrapper.offsetHeight),
    );

    return wrapper;
  }

  toggle(isEO: boolean, textarea: HTMLTextAreaElement, counter: HTMLElement): void {
    const eoWrap = document.getElementById(`${this._id}-eo-list-wrapper`);

    if (isEO) {
      textarea.style.display = "none";
      if (eoWrap) eoWrap.style.display = "";
      this._eoSwitch.setChecked(true);
      counter.style.display = "none";
      if (this._vm.eoList.get().length === 0) addEOEntry(this._vm);
    } else {
      textarea.style.display = "";
      if (eoWrap) eoWrap.style.display = "none";
      this._eoSwitch.setChecked(false);
      counter.style.display = "";
    }

    this.render();
  }

  render(): void {
    const wrapper = document.getElementById(
      `${this._id}-eo-list-wrapper`,
    ) as HTMLDivElement | null;
    if (!wrapper) return;
    if (wrapper.querySelector(".eo-edit-input")) return;
    wrapper.innerHTML = "";
    if (!this._vm.isEOView.get()) return;

    const eoList = this._vm.eoList.get();
    const selectedIdx = this._vm.selectedEOIndex.get();

    const indexed = eoList
      .map((eo, idx) => ({ eo, idx }))
      .sort((a, b) => {
        const ca = this._countMoves(a.eo);
        const cb = this._countMoves(b.eo);
        return ca !== cb ? ca - cb : a.idx - b.idx;
      });

    for (let rank = 0; rank < indexed.length; rank++) {
      const { eo, idx } = indexed[rank];
      const row = document.createElement("div");
      row.classList.add("eo-row");
      if (idx === selectedIdx) row.style.background = EO_SELECTED_BG;
      row.textContent = eo || "(Double click to edit)";
      row.title = eo;

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

    const addRow = document.createElement("div");
    addRow.className = "eo-add-row";
    const addBtn = document.createElement("button");
    addBtn.textContent = "+";
    addBtn.title = "Add EO";
    addBtn.className = "eo-add-button";
    addBtn.addEventListener("click", () => addEOEntry(this._vm));
    addRow.appendChild(addBtn);
    wrapper.appendChild(addRow);
  }

  bindObservables(
    textarea: HTMLTextAreaElement,
    counter: HTMLElement,
    onPreview?: (alg: string) => void,
  ): void {
    this._onPreview = onPreview;
    this._vm.isEOView.subscribe((isEO) => this.toggle(isEO, textarea, counter));
    const renderEO = () => this.render();
    this._vm.eoList.subscribe(renderEO);
    this._vm.selectedEOIndex.subscribe(renderEO);
  }

  private _editRow(idx: number, rank: number, wrapper: HTMLElement): void {
    const input = document.createElement("input");
    input.type = "text";
    input.value = this._vm.eoList.get()[idx] ?? "";
    input.className = "eo-edit-input";
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

  private _countMoves(eo: string): number {
    const COUNTABLE = /^(R|L|F|B|U|D|Rw|Lw|Fw|Bw|Uw|Dw)(2|'|w2|w')?$/;
    if (!eo.trim()) return 0;
    return eo.split(/\s+/).filter((t) => COUNTABLE.test(t)).length;
  }
}
