import { ScrambleViewModel } from "../viewmodels/ScrambleViewModel";
import { toggleInverseScramble } from "../actions/scrambleActions";

export class ScrambleInverseView {
    private readonly _vm: ScrambleViewModel;
    private readonly _text: HTMLDivElement;
    private readonly _btn: HTMLButtonElement;

    constructor(vm: ScrambleViewModel) {
        this._vm = vm;

        this._text = document.createElement("div");
        this._text.id = "inverse-scramble-text";
        this._text.classList.add("inverse-scramble");

        this._btn = document.createElement("button");
        this._btn.classList.add("inverse-button");
        this._btn.title = "Toggle inverse scramble";
        this._btn.addEventListener("click", () => toggleInverseScramble(this._vm));
    }

    appendTo(parent: HTMLElement): void {
        parent.appendChild(this._text);
        parent.appendChild(this._btn);
    }

    bindObservables(): void {
        this._vm.showingInverse.subscribe((showing) => {
            this._btn.textContent = showing ? "Hide inverse" : "Show inverse";
            this._text.style.display = showing ? "block" : "none";
            if (showing) {
                this._text.textContent = `Inverse: ${this._vm.inverseScramble.get()}`;
            }
        });

        this._vm.inverseScramble.subscribe((inv) => {
            if (this._vm.showingInverse.get()) {
                this._text.textContent = `Inverse: ${inv}`;
            }
        });
    }
}
