import { ScrambleViewModel } from "../viewmodels/ScrambleViewModel";
import { generateNewScramble } from "../actions/scrambleActions";
import { loadSvg } from "../utils/svgLoader";

export class ScrambleRefreshButtonView {
    private readonly _btn: HTMLButtonElement;

    constructor(vm: ScrambleViewModel) {
        this._btn = document.createElement("button");
        this._btn.classList.add("new-scramble-button");
        this._btn.title = "New scramble / Reset all";
        this._btn.textContent = "↺";

        loadSvg("/assets/restart.svg")
            .then((svg) => { this._btn.innerHTML = svg; })
            .catch(() => { });

        this._btn.addEventListener("click", async () => {
            if (!confirm("Are you sure you want to restart?")) return;
            await generateNewScramble(vm);
        });
    }

    appendTo(parent: HTMLElement): void {
        parent.appendChild(this._btn);
    }
}
