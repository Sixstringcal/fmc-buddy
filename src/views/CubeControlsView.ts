import { CubeNodeViewModel } from "../viewmodels/CubeNodeViewModel";
import { MoveCounterView } from "./MoveCounterView";
import { ModeToggleView } from "./ModeToggleView";
import { RotationButtonsView } from "./RotationButtonsView";
import { RatingButtonsView } from "./RatingButtonsView";

export class CubeControlsView {
  private readonly _moveCounter: MoveCounterView;
  private readonly _modeToggle: ModeToggleView;
  private readonly _rotationButtons: RotationButtonsView;
  private readonly _ratingButtons: RatingButtonsView;

  constructor(vm: CubeNodeViewModel) {
    this._moveCounter = new MoveCounterView(vm);
    this._modeToggle = new ModeToggleView(vm);
    this._rotationButtons = new RotationButtonsView(vm);
    this._ratingButtons = new RatingButtonsView(vm);
  }

  appendTo(parent: HTMLElement): void {
    this._moveCounter.appendTo(parent);
    this._modeToggle.appendTo(parent);
    this._rotationButtons.appendTo(parent);
    this._ratingButtons.appendTo(parent);
  }

  bindObservables(container: HTMLElement): void {
    this._moveCounter.bindObservables();
    this._modeToggle.bindObservables();
    this._rotationButtons.bindObservables();
    this._ratingButtons.bindObservables(container);
  }

  getMoveCounterElement(): HTMLElement {
    return this._moveCounter.getElement();
  }
}
