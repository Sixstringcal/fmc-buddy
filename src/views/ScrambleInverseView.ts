import { ScrambleViewModel } from "../viewmodels/ScrambleViewModel";
import { toggleInverseScramble } from "../actions/scrambleActions";
import { Div, Button } from "../utils/ui";

export class ScrambleInverseView {
    private readonly _vm: ScrambleViewModel;
    private readonly _text: HTMLDivElement;
    private readonly _btn: HTMLButtonElement;

    constructor(vm: ScrambleViewModel) {
        this._vm = vm;

        this._text = Div({ classes: "inverse-scramble" });
        this._btn = Button({ classes: "inverse-button", title: "Toggle inverse scramble", onClick: () => toggleInverseScramble(this._vm) });
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
