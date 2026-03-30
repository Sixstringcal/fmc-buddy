import { CubeNodeViewModel } from "../viewmodels/CubeNodeViewModel";
import { markAsGood, markAsBad } from "../actions/cubeNodeActions";
import { Row, Button } from "../utils/ui";

export class RatingButtonsView {
  private readonly _vm: CubeNodeViewModel;
  private readonly _wrapper: HTMLDivElement;

  constructor(vm: CubeNodeViewModel) {
    this._vm = vm;

    this._wrapper = Row(
      { classes: "rating-wrapper", justify: "center", style: { marginTop: "10px" } },
      Button({ html: "👍", classes: "rating-button thumbs-up", style: { marginRight: "10px" }, onClick: () => markAsGood(this._vm) }),
      Button({ html: "👎", classes: "rating-button thumbs-down", onClick: () => markAsBad(this._vm) }),
    );
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
