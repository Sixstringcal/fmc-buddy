import { Observable } from "../core/Observable";
import { ViewModel } from "../core/ViewModel";
import { CubeNodeState } from "../models/types";
import {
    countMoves,
    invertMoves,
    normalizeApostrophes,
    separateMoves,
    stripComments,
    validMove,
} from "../utils/moveAlgebra";

export class CubeNodeViewModel extends ViewModel {
    readonly id: string;
    readonly scramble: Observable<string>;
    readonly rawMoves = new Observable<string>("");
    readonly isNormal = new Observable<boolean>(true);
    readonly isMinimized = new Observable<boolean>(false);
    readonly secretRotation = new Observable<string>("");
    readonly isGood = new Observable<boolean | null>(null);
    readonly position: Observable<{ left: number; top: number }>;
    readonly textboxDimensions = new Observable<
        { width: number; height: number } | undefined
    >(undefined);
    readonly isEOView = new Observable<boolean>(false);
    readonly eoList = new Observable<string[]>([]);
    readonly selectedEOIndex = new Observable<number>(0);
    readonly moveCount = new Observable<number>(0);

    /** The full alg string to feed the TwistyPlayer. */
    readonly playerAlg = new Observable<string>("");

    constructor(
        id: string,
        initialScramble: string,
        state?: Partial<CubeNodeState>,
    ) {
        super();
        this.id = id;
        this.scramble = new Observable<string>(initialScramble);
        this.position = new Observable<{ left: number; top: number }>(
            state?.position ?? { left: 100, top: 100 },
        );

        if (state) {
            if (state.moves != null) this.rawMoves.set(state.moves);
            if (state.isNormal != null) this.isNormal.set(state.isNormal);
            if (state.isMinimized != null) this.isMinimized.set(state.isMinimized);
            if (state.secretRotation != null)
                this.secretRotation.set(state.secretRotation);
            if (state.isGood !== undefined) this.isGood.set(state.isGood ?? null);
            if (state.textboxDimensions)
                this.textboxDimensions.set(state.textboxDimensions);
            if (state.isEOView != null) this.isEOView.set(state.isEOView);
            if (state.eoList) this.eoList.set([...state.eoList]);
            if (state.selectedEOIndex != null)
                this.selectedEOIndex.set(state.selectedEOIndex);
        }

        const recompute = () => this._recompute();
        this.addDisposable(this.scramble.subscribe(recompute));
        this.addDisposable(this.rawMoves.subscribe(recompute));
        this.addDisposable(this.isNormal.subscribe(recompute));
        this.addDisposable(this.secretRotation.subscribe(recompute));
        this.addDisposable(this.isEOView.subscribe(recompute));
        this.addDisposable(this.selectedEOIndex.subscribe(recompute));
        this.addDisposable(this.eoList.subscribe(recompute));
    }

    toState(): CubeNodeState {
        return {
            id: this.id,
            moves: this.rawMoves.get(),
            position: this.position.get(),
            isMinimized: this.isMinimized.get(),
            isNormal: this.isNormal.get(),
            secretRotation: this.secretRotation.get(),
            isGood: this.isGood.get(),
            textboxDimensions: this.textboxDimensions.get(),
            isEOView: this.isEOView.get(),
            eoList: [...this.eoList.get()],
            selectedEOIndex: this.selectedEOIndex.get(),
        };
    }

    private _recompute(): void {
        const raw = this.isEOView.get()
            ? this.eoList.get()[this.selectedEOIndex.get()] ?? ""
            : this.rawMoves.get();

        const cleaned = normalizeApostrophes(stripComments(raw));
        const alg = this._buildAlg(cleaned);

        this.playerAlg.set(alg);
        this.moveCount.set(countMoves(cleaned));
    }

    private _buildAlg(cleanedMoves: string): string {
        if (!cleanedMoves.trim()) {
            const base = this.isNormal.get()
                ? this.scramble.get()
                : invertMoves(this.scramble.get());
            return this.secretRotation.get()
                ? `${base} ${this.secretRotation.get()}`
                : base;
        }

        const { normalMoves, inverseMoves } = separateMoves(cleanedMoves);
        const parts: string[] = [];

        if (this.isNormal.get()) {
            if (inverseMoves) {
                parts.push(...this._filterValid(invertMoves(inverseMoves).split(" ")));
            }
            if (this.scramble.get()) {
                parts.push(...this._filterValid(this.scramble.get().split(" ")));
            }
            if (normalMoves) {
                parts.push(...this._filterValid(normalMoves.split(" ")));
            }
        } else {
            if (normalMoves) {
                parts.push(...this._filterValid(invertMoves(normalMoves).split(" ")));
            }
            if (this.scramble.get()) {
                parts.push(
                    ...this._filterValid(invertMoves(this.scramble.get()).split(" ")),
                );
            }
            if (inverseMoves) {
                parts.push(...this._filterValid(inverseMoves.split(" ")));
            }
        }

        if (this.secretRotation.get()) {
            parts.push(this.secretRotation.get());
        }

        return parts.join(" ");
    }

    computePreviewAlg(rawText: string): string {
        const cleaned = normalizeApostrophes(stripComments(rawText));
        return this._buildAlg(cleaned);
    }

    private _filterValid(moves: string[]): string[] {
        return moves.filter((m) => m && validMove(m));
    }
}
