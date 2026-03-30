import { ScrambleViewModel } from "./viewmodels/ScrambleViewModel";
import {
    applyManualScramble,
    generateNewScramble,
    toggleInverseScramble,
} from "./actions/scrambleActions";
import { loadSvg } from "./utils/svgLoader";

export class ScrambleView {
    private _vm: ScrambleViewModel | null = null;
    /** @deprecated */
    private scrambleContainer: HTMLElement;
    private scrambleText: HTMLElement;
    private inverseScrambleText: HTMLElement;
    private inverseButton: HTMLButtonElement;

    constructor(_legacyScramble: string) {
        this.scrambleContainer = document.createElement("div");
        this.scrambleText = document.createElement("div");
        this.inverseScrambleText = document.createElement("div");
        this.inverseButton = document.createElement("button");
    }

    bindViewModel(vm: ScrambleViewModel): void {
        this._vm = vm;
    }

    initialize(): void {
        if (!this._vm) {
            throw new Error("ScrambleView: call bindViewModel() before initialize()");
        }

        this.scrambleContainer.id = "scramble-container";
        this.scrambleContainer.classList.add("scramble-container");
        this.scrambleContainer.style.cssText = "position:absolute;top:0;left:0;";

        const label = document.createElement("div");
        label.textContent = "Scramble:";
        label.classList.add("scramble-label");
        this.scrambleContainer.appendChild(label);

        this.scrambleText.id = "scramble-text";
        this.scrambleContainer.appendChild(this.scrambleText);

        this.scrambleContainer.appendChild(this._buildEditButton());
        this._buildInverseSection();
        this.scrambleContainer.appendChild(this._buildRefreshButton());

        document.body.insertBefore(this.scrambleContainer, document.body.firstChild);

        this._bindObservables();
    }

    private _buildEditButton(): HTMLButtonElement {
        const btn = document.createElement("button");
        btn.innerHTML = "✏️";
        btn.classList.add("edit-button");
        let isEditing = false;

        const commit = (input: HTMLInputElement) => {
            applyManualScramble(this._vm!, input.value);
            input.remove();
            btn.textContent = "✏️";
            isEditing = false;
        };

        btn.addEventListener("click", () => {
            if (isEditing) {
                const input = this.scrambleContainer.querySelector(
                    "input.scramble-input",
                ) as HTMLInputElement | null;
                if (input) commit(input);
            } else {
                isEditing = true;
                const input = document.createElement("input");
                input.type = "text";
                input.value = this._vm!.scramble.get();
                input.classList.add("scramble-input");
                input.addEventListener("input", () =>
                    applyManualScramble(this._vm!, input.value),
                );
                input.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") commit(input);
                });
                this.scrambleContainer.insertBefore(input, this.scrambleText);
                this.scrambleText.textContent = "";
                input.select();
                btn.textContent = "✔️";
            }
        });

        return btn;
    }

    private _buildInverseSection(): void {
        this.inverseScrambleText.id = "inverse-scramble-text";
        this.inverseScrambleText.classList.add("inverse-scramble");
        this.scrambleContainer.appendChild(this.inverseScrambleText);

        this.inverseButton.classList.add("inverse-button");
        this.inverseButton.title = "Toggle inverse scramble";
        this.inverseButton.addEventListener("click", () =>
            toggleInverseScramble(this._vm!),
        );
        this.scrambleContainer.appendChild(this.inverseButton);
    }

    private _buildRefreshButton(): HTMLButtonElement {
        const btn = document.createElement("button");
        btn.classList.add("new-scramble-button");
        btn.title = "New scramble / Reset all";
        btn.textContent = "↺";

        loadSvg("/assets/restart.svg")
            .then((svg) => { btn.innerHTML = svg; })
            .catch(() => { });

        btn.addEventListener("click", async () => {
            if (!confirm("Are you sure you want to restart?")) return;
            await generateNewScramble(this._vm!);
        });

        return btn;
    }

    private _bindObservables(): void {
        const vm = this._vm!;

        vm.scramble.subscribe((s) => {
            this.scrambleText.textContent = s;
        });

        vm.showingInverse.subscribe((showing) => {
            this.inverseButton.textContent = showing ? "Hide inverse" : "Show inverse";
            this.inverseScrambleText.style.display = showing ? "block" : "none";
            if (showing) {
                this.inverseScrambleText.textContent = `Inverse: ${vm.inverseScramble.get()}`;
            }
        });

        vm.inverseScramble.subscribe((inv) => {
            if (vm.showingInverse.get()) {
                this.inverseScrambleText.textContent = `Inverse: ${inv}`;
            }
        });
    }

    /** @deprecated AppViewModel now owns the scramble observable. */
    updateScramble(newScramble: string): void {
        if (this._vm) {
            applyManualScramble(this._vm, newScramble);
        }
    }

    /** @deprecated Connections are now managed by AppViewModel. */
    registerCubeView(_unused: unknown): void { /* no-op */ }

    /** @deprecated The refresh callback wires through AppViewModel.reset() now. */
    onRefreshScramble(_unused: unknown): void { /* no-op */ }
}
