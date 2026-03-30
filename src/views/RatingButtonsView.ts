import { CubeNodeViewModel } from "../viewmodels/CubeNodeViewModel";
import { markAsGood, markAsBad } from "../actions/cubeNodeActions";
import { Row, Button } from "../utils/ui";
import { Css } from "../models/css";
import { BgColor, RatingIcon } from "../models/types";

export class RatingButtonsView {
  private readonly _vm: CubeNodeViewModel;
  private readonly _wrapper: HTMLDivElement;

  constructor(vm: CubeNodeViewModel) {
    this._vm = vm;

    this._wrapper = Row(
      { classes: Css.RatingWrapper, justify: "center", style: { marginTop: "10px" } },
      Button({ html: RatingIcon.ThumbsUp,   classes: `${Css.RatingButton} ${Css.ThumbsUp}`,   style: { marginRight: "10px" }, onClick: () => markAsGood(this._vm) }),
      Button({ html: RatingIcon.ThumbsDown, classes: `${Css.RatingButton} ${Css.ThumbsDown}`, onClick: () => markAsBad(this._vm) }),
    );
  }

  appendTo(parent: HTMLElement): void {
    parent.appendChild(this._wrapper);
  }

  bindObservables(container: HTMLElement): void {
    this._vm.isGood.subscribe((good) => {
      const up = container.querySelector<HTMLElement>(`.${Css.ThumbsUp}`);
      const dn = container.querySelector<HTMLElement>(`.${Css.ThumbsDown}`);
      up?.classList.remove(Css.Active);
      dn?.classList.remove(Css.Active);

      if (good === true) {
        container.style.backgroundColor = BgColor.Good;
        up?.classList.add(Css.Active);
      } else if (good === false) {
        container.style.backgroundColor = BgColor.Bad;
        dn?.classList.add(Css.Active);
      } else {
        container.style.backgroundColor = BgColor.None;
      }
    });
  }
}
