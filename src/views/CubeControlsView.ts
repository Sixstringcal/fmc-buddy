import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { CubeNodeViewModel } from "../viewmodels/CubeNodeViewModel";
import { MoveCounterView } from "./MoveCounterView";
import { ModeToggleView } from "./ModeToggleView";
import { RotationButtons } from "./RotationButtonsView";
import { RotationButtonsViewModel } from "../viewmodels/RotationButtonsViewModel";
import { RatingButtons } from "./RatingButtonsView";

export class CubeControlsView {
  private readonly _moveCounter: MoveCounterView;
  private readonly _modeToggle: ModeToggleView;
  private readonly _rotationButtonsVm: RotationButtonsViewModel;
  private readonly _rotationContainer: HTMLElement;
  private readonly _ratingContainer: HTMLElement;
  private readonly _vm: CubeNodeViewModel;

  constructor(vm: CubeNodeViewModel) {
    this._vm = vm;
    this._moveCounter = new MoveCounterView(vm);
    this._modeToggle = new ModeToggleView(vm);
    this._rotationButtonsVm = new RotationButtonsViewModel(vm);
    this._rotationContainer = document.createElement("div");
    this._ratingContainer = document.createElement("div");
  }

  appendTo(parent: HTMLElement): void {
    this._moveCounter.appendTo(parent);
    this._modeToggle.appendTo(parent);
    
    // Mount the Jalvin/React components
    createRoot(this._rotationContainer).render(
        createElement(RotationButtons, { vm: this._rotationButtonsVm })
    );
    createRoot(this._ratingContainer).render(
        createElement(RatingButtons, { vm: this._vm })
    );
    
    parent.appendChild(this._rotationContainer);
    parent.appendChild(this._ratingContainer);
  }

  bindObservables(): void {
    this._moveCounter.bindObservables();
    this._modeToggle.bindObservables();
  }

  getMoveCounterElement(): HTMLElement {
    return this._moveCounter.getElement();
  }
}
