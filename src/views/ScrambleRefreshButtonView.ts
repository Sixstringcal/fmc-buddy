import { ScrambleViewModel } from "../viewmodels/ScrambleViewModel";
import { generateNewScramble } from "../actions/scrambleActions";
import { loadSvg } from "../utils/svgLoader";
import { Button } from "../utils/ui";

export class ScrambleRefreshButtonView {
    private readonly _btn: HTMLButtonElement;

    constructor(vm: ScrambleViewModel) {
        this._btn = Button({
            classes: "new-scramble-button",
            title: "New scramble / Reset all",
            text: "↺",
            onClick: async () => {
                if (!confirm("Are you sure you want to restart?")) return;
                await generateNewScramble(vm);
            },
        });

        loadSvg("/assets/restart.svg")
            .then((svg) => { this._btn.innerHTML = svg; })
            .catch(() => { });
    }

    appendTo(parent: HTMLElement): void {
        parent.appendChild(this._btn);
    }
}
