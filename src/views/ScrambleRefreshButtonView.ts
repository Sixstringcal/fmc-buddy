import { ScrambleViewModel } from "../viewmodels/ScrambleViewModel";
import { generateNewScramble } from "../actions/scrambleActions";
import { loadSvg } from "../utils/svgLoader";
import { Button } from "../utils/ui";
import { Css } from "../models/css";
import { Asset, ScrambleRefreshText } from "../models/types";

export class ScrambleRefreshButtonView {
    private readonly _btn: HTMLButtonElement;

    constructor(vm: ScrambleViewModel) {
        this._btn = Button({
            classes: Css.NewScrambleButton,
            title: ScrambleRefreshText.Title,
            text: ScrambleRefreshText.FallbackIcon,
            onClick: async () => {
                if (!confirm(ScrambleRefreshText.ConfirmRestart)) return;
                await generateNewScramble(vm);
            },
        });

        loadSvg(Asset.RestartSvg)
            .then((svg) => { this._btn.innerHTML = svg; })
            .catch(() => { });
    }

    appendTo(parent: HTMLElement): void {
        parent.appendChild(this._btn);
    }
}
