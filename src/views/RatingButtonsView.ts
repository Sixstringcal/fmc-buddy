import { CubeNodeViewModel } from "../viewmodels/CubeNodeViewModel";
import { markAsGood, markAsBad } from "../actions/cubeNodeActions";

export class RatingButtonsView {
  private readonly _vm: CubeNodeViewModel;
  private readonly _wrapper: HTMLDivElement;

  constructor(vm: CubeNodeViewModel) {
    this._vm = vm;

    this._wrapper = document.createElement("div");
    this._wrapper.id = `${vm.id}-rating-wrapper`;
    this._wrapper.classList.add("rating-wrapper");
    this._wrapper.style.cssText = "display:flex;justify-content:center;margin-top:10px;";

    const thumbsUp = document.createElement("button");
    thumbsUp.innerHTML = "👍";
    thumbsUp.classList.add("rating-button", "thumbs-up");
    thumbsUp.style.marginRight = "10px";
    thumbsUp.addEventListener("click", () => markAsGood(this._vm));
    this._wrapper.appendChild(thumbsUp);

    const thumbsDown = document.createElement("button");
    thumbsDown.innerHTML = "👎";
    thumbsDown.classList.add("rating-button", "thumbs-down");
    thumbsDown.addEventListener("click", () => markAsBad(this._vm));
    this._wrapper.appendChild(thumbsDown);
  }

  appendTo(parent: HTMLElement): void {
    parent.appendChild(this._wrapper);
  }

  bindObservables(container: HTMLElement): void {
    this._vm.isGood.subscribe((good) => {
      const up = container.querySelector<HTMLElement>(".thumbs-up");
      const dn = container.querySelector<HTMLElement>(".thumbs-down");
      up?.classList.remove("active");
      dn?.classList.remove("active");

      if (good === true) {
        container.style.backgroundColor = "lightgreen";
        up?.classList.add("active");
      } else if (good === false) {
        container.style.backgroundColor = "lightcoral";
        dn?.classList.add("active");
      } else {
        container.style.backgroundColor = "";
      }
    });
  }
}
