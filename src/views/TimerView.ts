import { TimerViewModel } from "../viewmodels/TimerViewModel";
import { TimerSnapshot } from "../models/types";
import { TimerDisplayView } from "./TimerDisplayView";
import { TimerControlsView } from "./TimerControlsView";
import { Div } from "../utils/ui";

export class TimerView {
    private readonly _vm: TimerViewModel;
    private readonly _container: HTMLElement;
    private readonly _display: TimerDisplayView;
    private readonly _controls: TimerControlsView;
    private readonly _scrambleEl: HTMLElement;

    constructor(vm: TimerViewModel, scrambleEl: HTMLElement) {
        this._vm = vm;
        this._scrambleEl = scrambleEl;

        this._container = Div({ classes: "countdown-timer" });

        this._display = new TimerDisplayView();
        this._display.appendTo(this._container);

        this._controls = new TimerControlsView(vm);
        this._controls.appendTo(this._container);

        this._controls.loadIcons().then(() => this._bindObservables());

        this._positionBelowScramble();
        window.addEventListener("resize", () => this._positionBelowScramble());
    }

    getElement(): HTMLElement {
        return this._container;
    }

    private _bindObservables(): void {
        this._vm.snapshot.subscribe((snap) => this._render(snap));
    }

    private _render(snap: TimerSnapshot): void {
        this._display.render(snap);
        this._controls.render(snap);
    }

    private _positionBelowScramble(): void {
        const sr = this._scrambleEl.getBoundingClientRect();
        const tr = this._container.getBoundingClientRect();

        const overlapping = !(
            tr.top > sr.bottom ||
            tr.right < sr.left ||
            tr.bottom < sr.top ||
            tr.left > sr.right
        );

        this._container.style.marginTop = overlapping
            ? `${sr.height + 10}px`
            : "0px";
    }
}
