import { TwistyPlayer } from "cubing/twisty";
import { Connection } from "../Connection";
import { CubeNodeViewModel } from "../viewmodels/CubeNodeViewModel";
import { EOListView } from "./EOListView";
import { MoveTextareaView } from "./MoveTextareaView";

export interface CubeInputCallbacks {
  onDuplicate: () => void;
  onFinish: () => void;
  addTargetConnection: (connection: Connection) => void;
  showToast: (message: string) => void;
}

export class CubeInputView {
  private readonly _vm: CubeNodeViewModel;
  private readonly _id: string;
  private readonly _twistyPlayer: TwistyPlayer;
  private readonly _callbacks: CubeInputCallbacks;

  private _eoListView!: EOListView;
  private _textareaView!: MoveTextareaView;

  constructor(
    vm: CubeNodeViewModel,
    twistyPlayer: TwistyPlayer,
    callbacks: CubeInputCallbacks,
  ) {
    this._vm = vm;
    this._id = vm.id;
    this._twistyPlayer = twistyPlayer;
    this._callbacks = callbacks;
  }

  appendTo(parent: HTMLElement): void {
    this._eoListView = new EOListView(this._vm);

    const inputWrap = document.createElement("div");
    inputWrap.id = `${this._id}-input-wrapper`;
    inputWrap.style.cssText =
      "display:flex;flex-direction:row;align-items:flex-start;width:100%;";
    parent.appendChild(inputWrap);

    // EO switch
    inputWrap.appendChild(this._eoListView.createSwitchWrapper());

    // Textarea (MoveTextareaView handles events, size restore, and move parsing)
    this._textareaView = new MoveTextareaView(this._vm, this._twistyPlayer, {
      addTargetConnection: (c) => this._callbacks.addTargetConnection(c),
      showToast: (msg) => this._callbacks.showToast(msg),
    });
    this._textareaView.appendTo(inputWrap);

    // EO list wrapper
    const ta = this._textareaView.getElement();
    const eoListWrapper = this._eoListView.createListWrapper();
    inputWrap.insertBefore(eoListWrapper, ta);

    const dims = this._vm.textboxDimensions.get();
    if (dims) {
      eoListWrapper.style.width = `${dims.width}px`;
      eoListWrapper.style.height = `${dims.height}px`;
    }

    // Duplicate button
    const dupBtn = document.createElement("button");
    dupBtn.id = `${this._id}-duplicate-button`;
    dupBtn.textContent = "+";
    dupBtn.classList.add("duplicate-button");
    dupBtn.title = "Duplicate this cube view";
    dupBtn.addEventListener("click", () => this._callbacks.onDuplicate());
    inputWrap.appendChild(dupBtn);

    // Finish button
    const finBtn = document.createElement("button");
    finBtn.id = `${this._id}-finish-button`;
    finBtn.textContent = "✔";
    finBtn.classList.add("finish-button");
    finBtn.title = "Finish this cube view";
    finBtn.addEventListener("click", () => this._callbacks.onFinish());
    inputWrap.appendChild(finBtn);
  }

  bindObservables(counter: HTMLElement): void {
    this._eoListView.bindObservables(
      this._textareaView.getElement(),
      counter,
      (alg) => { this._twistyPlayer.alg = alg; },
    );
  }

  getTextarea(): HTMLTextAreaElement {
    return this._textareaView.getElement();
  }}