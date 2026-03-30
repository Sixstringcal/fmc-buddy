import { ScrambleViewModel } from "../viewmodels/ScrambleViewModel";
import { toggleInverseScramble } from "../actions/scrambleActions";
import { Div, Button } from "../utils/ui";
import { Css } from "../models/css";
import { Display, ScrambleInverseText } from "../models/types";

export class ScrambleInverseView {
    private readonly _vm: ScrambleViewModel;
    private readonly _text: HTMLDivElement;
    private readonly _btn: HTMLButtonElement;

    constructor(vm: ScrambleViewModel) {
        this._vm = vm;

        this._text = Div({ classes: Css.InverseScramble });
        this._btn = Button({ classes: Css.InverseButton, title: ScrambleInverseText.Title, onClick: () => toggleInverseScramble(this._vm) });
    }

    appendTo(parent: HTMLElement): void {
        parent.appendChild(this._text);
        parent.appendChild(this._btn);
    }

    bindObservables(): void {
        this._vm.showingInverse.subscribe((showing) => {
            this._btn.textContent = showing ? ScrambleInverseText.Hide : ScrambleInverseText.Show;
            this._text.style.display = showing ? Display.Block : Display.None;
            if (showing) {
                this._text.textContent = `${ScrambleInverseText.Prefix}${this._vm.inverseScramble.get()}`;
            }
        });

        this._vm.inverseScramble.subscribe((inv) => {
            if (this._vm.showingInverse.get()) {
                this._text.textContent = `${ScrambleInverseText.Prefix}${inv}`;
            }
        });
    }
}
