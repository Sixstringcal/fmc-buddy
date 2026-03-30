import { ScrambleViewModel } from "../viewmodels/ScrambleViewModel";
import { applyManualScramble } from "../actions/scrambleActions";
import { ScrambleEditView } from "./ScrambleEditView";
import { ScrambleInverseView } from "./ScrambleInverseView";
import { ScrambleRefreshButtonView } from "./ScrambleRefreshButtonView";
import { Div } from "../utils/ui";
import { Css } from "../models/css";

export class ScrambleView {
    private _vm: ScrambleViewModel | null = null;
    /** @deprecated */
    private _container!: HTMLElement;
    private _editView!: ScrambleEditView;
    private _inverseView!: ScrambleInverseView;
    private _refreshButton!: ScrambleRefreshButtonView;

    constructor(_legacyScramble: string) { }

    getElement(): HTMLElement {
        return this._container;
    }

    bindViewModel(vm: ScrambleViewModel): void {
        this._vm = vm;
    }

    initialize(): void {
        if (!this._vm) {
            throw new Error("ScrambleView: call bindViewModel() before initialize()");
        }

        this._container = Div({
            classes: Css.ScrambleContainer,
            style: "position:absolute;top:0;left:0;",
        });

        this._editView = new ScrambleEditView(this._vm);
        this._editView.appendTo(this._container);

        this._inverseView = new ScrambleInverseView(this._vm);
        this._inverseView.appendTo(this._container);

        this._refreshButton = new ScrambleRefreshButtonView(this._vm);
        this._refreshButton.appendTo(this._container);

        document.body.insertBefore(this._container, document.body.firstChild);

        this._editView.bindObservables();
        this._inverseView.bindObservables();
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
