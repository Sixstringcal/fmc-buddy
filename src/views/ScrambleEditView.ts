import { ScrambleViewModel } from "../viewmodels/ScrambleViewModel";
import { applyManualScramble } from "../actions/scrambleActions";
import { Div, Button, Input } from "../utils/ui";
import { Css } from "../models/css";
import { Key, ScrambleEditIcon } from "../models/types";

export class ScrambleEditView {
    private readonly _vm: ScrambleViewModel;
    private readonly _label: HTMLDivElement;
    private readonly _text: HTMLDivElement;
    private readonly _editBtn: HTMLButtonElement;
    private _isEditing = false;
    private _currentInput: HTMLInputElement | null = null;

    constructor(vm: ScrambleViewModel) {
        this._vm = vm;

        this._label = Div({ text: "Scramble:", classes: Css.ScrambleLabel });
        this._text = Div({ classes: Css.ScrambleText });
        this._editBtn = Button({ html: ScrambleEditIcon.Edit, classes: Css.EditButton, onClick: () => this._handleClick() });
    }

    appendTo(parent: HTMLElement): void {
        parent.appendChild(this._label);
        parent.appendChild(this._text);
        parent.appendChild(this._editBtn);
    }

    bindObservables(): void {
        this._vm.scramble.subscribe((s) => {
            if (!this._isEditing) this._text.textContent = s;
        });
    }

    private _handleClick(): void {
        if (this._isEditing && this._currentInput) {
            this._commit(this._currentInput);
        } else {
            this._isEditing = true;
            const input = Input({
                classes: Css.ScrambleInput,
                value: this._vm.scramble.get(),
                on: {
                    input: () => applyManualScramble(this._vm, input.value),
                    keydown: (e) => { if (e.key === Key.Enter) this._commit(input); },
                },
            });
            this._currentInput = input;
            this._text.parentElement?.insertBefore(input, this._text);
            this._text.textContent = "";
            input.select();
            this._editBtn.textContent = ScrambleEditIcon.Commit;
        }
    }

    private _commit(input: HTMLInputElement): void {
        applyManualScramble(this._vm, input.value);
        input.remove();
        this._currentInput = null;
        this._editBtn.textContent = ScrambleEditIcon.Edit;
        this._isEditing = false;
    }
}
