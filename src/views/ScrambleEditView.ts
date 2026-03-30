import { ScrambleViewModel } from "../viewmodels/ScrambleViewModel";
import { applyManualScramble } from "../actions/scrambleActions";

export class ScrambleEditView {
    private readonly _vm: ScrambleViewModel;
    private readonly _label: HTMLDivElement;
    private readonly _text: HTMLDivElement;
    private readonly _editBtn: HTMLButtonElement;
    private _isEditing = false;
    private _currentInput: HTMLInputElement | null = null;

    constructor(vm: ScrambleViewModel) {
        this._vm = vm;

        this._label = document.createElement("div");
        this._label.textContent = "Scramble:";
        this._label.classList.add("scramble-label");

        this._text = document.createElement("div");
        this._text.id = "scramble-text";

        this._editBtn = document.createElement("button");
        this._editBtn.innerHTML = "✏️";
        this._editBtn.classList.add("edit-button");
        this._editBtn.addEventListener("click", () => this._handleClick());
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
            const input = document.createElement("input");
            input.type = "text";
            input.value = this._vm.scramble.get();
            input.classList.add("scramble-input");
            input.addEventListener("input", () => applyManualScramble(this._vm, input.value));
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") this._commit(input);
            });
            this._currentInput = input;
            this._text.parentElement?.insertBefore(input, this._text);
            this._text.textContent = "";
            input.select();
            this._editBtn.textContent = "✔️";
        }
    }

    private _commit(input: HTMLInputElement): void {
        applyManualScramble(this._vm, input.value);
        input.remove();
        this._currentInput = null;
        this._editBtn.textContent = "✏️";
        this._isEditing = false;
    }
}
