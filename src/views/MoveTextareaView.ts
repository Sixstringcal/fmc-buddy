import { TwistyPlayer } from "cubing/twisty";
import { Connection } from "../Connection";
import { CubeNodeViewModel } from "../viewmodels/CubeNodeViewModel";
import { applyMovesFromInput, updateTextboxDimensions } from "../actions/cubeNodeActions";
import { TextArea } from "../utils/ui";
import {
  normalizeApostrophes,
  separateMoves,
  stripComments,
  validMove,
} from "../utils/moveAlgebra";
import { applyAutoCloseParen, toggleLineComment } from "../utils/textEditing";
import { Css } from "../models/css";

export interface MoveTextareaCallbacks {
  addTargetConnection: (connection: Connection) => void;
  showToast: (message: string) => void;
  onRawMovesChange?: (raw: string) => void;
}

export class MoveTextareaView {
  private readonly _vm: CubeNodeViewModel;
  private readonly _twistyPlayer: TwistyPlayer;
  private readonly _callbacks: MoveTextareaCallbacks;
  private readonly _textarea: HTMLTextAreaElement;
  private _prevFullAlg = "";

  constructor(
    vm: CubeNodeViewModel,
    twistyPlayer: TwistyPlayer,
    callbacks: MoveTextareaCallbacks,
  ) {
    this._vm = vm;
    this._twistyPlayer = twistyPlayer;
    this._callbacks = callbacks;

    this._textarea = TextArea({ classes: Css.MoveInput, style: { flexGrow: "1" } });

    this._restoreSize();
    this._bindEvents();
  }

  getElement(): HTMLTextAreaElement {
    return this._textarea;
  }

  appendTo(parent: HTMLElement): void {
    parent.appendChild(this._textarea);
  }

  private _restoreSize(): void {
    const saved = this._vm.rawMoves.get();
    if (saved) this._textarea.value = saved;

    const dims = this._vm.textboxDimensions.get();
    if (dims) {
      this._textarea.style.width = `${dims.width}px`;
      this._textarea.style.height = `${dims.height}px`;
    }

    this._textarea.addEventListener("mouseup", () =>
      updateTextboxDimensions(
        this._vm,
        this._textarea.offsetWidth,
        this._textarea.offsetHeight,
      ),
    );
    this._textarea.addEventListener("touchend", () =>
      updateTextboxDimensions(
        this._vm,
        this._textarea.offsetWidth,
        this._textarea.offsetHeight,
      ),
    );
  }

  private _bindEvents(): void {
    const ta = this._textarea;
    let previousValue = ta.value;
    this._prevFullAlg = this._vm.playerAlg.get();

    ta.addEventListener("input", () => {
      const cursor = ta.selectionStart;
      const cur = ta.value;

      const parenResult = applyAutoCloseParen(cur, cursor, previousValue);
      if (parenResult) {
        ta.value = parenResult.newValue;
        ta.selectionStart = ta.selectionEnd = parenResult.newCursor;
      }

      previousValue = ta.value;
      const movesUpToCursor = ta.value.substring(0, ta.selectionStart);
      const cursorAtEnd = ta.selectionStart >= ta.value.length;

      applyMovesFromInput(this._vm, ta.value);

      const currentFullAlg = this._vm.playerAlg.get();

      if (cursorAtEnd) {
        const prevWords = this._prevFullAlg.trim() ? this._prevFullAlg.split(" ") : [];
        const newWords = currentFullAlg.trim() ? currentFullAlg.split(" ") : [];
        if (
          newWords.length === prevWords.length + 1 &&
          (prevWords.length === 0 || currentFullAlg.startsWith(this._prevFullAlg + " "))
        ) {
          const lastMove = newWords[newWords.length - 1]!;
          this._twistyPlayer.alg = this._prevFullAlg;
          this._twistyPlayer.experimentalAddMove(lastMove);
        } else {
          this._twistyPlayer.alg = currentFullAlg;
        }
        this._prevFullAlg = currentFullAlg;
      } else {
        this._twistyPlayer.alg = this._vm.computePreviewAlg(movesUpToCursor);
      }

      const cleaned = normalizeApostrophes(stripComments(ta.value));
      const { normalMoves, inverseMoves } = separateMoves(cleaned);
      for (const t of [
        ...normalMoves.split(/\s+/),
        ...inverseMoves.split(/\s+/),
      ].filter(Boolean)) {
        if (!validMove(t)) this._callbacks.showToast(`Invalid move: ${t}`);
      }

      // Update minimize preview text if visible
      this._callbacks.onRawMovesChange?.(ta.value);
    });

    ta.addEventListener("click", () => {
      const movesUpToCursor = ta.value.substring(0, ta.selectionStart);
      this._twistyPlayer.alg = this._vm.computePreviewAlg(movesUpToCursor);
    });

    const arrowKeys = new Set<string>([
      "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End",
    ]);
    ta.addEventListener("keyup", (e) => {
      if (arrowKeys.has(e.key)) {
        const movesUpToCursor = ta.value.substring(0, ta.selectionStart);
        this._twistyPlayer.alg = this._vm.computePreviewAlg(movesUpToCursor);
      }
    });

    // Ctrl+/ or Cmd+/ to toggle comments
    ta.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        const { newValue, newStart, newEnd } = toggleLineComment(
          ta.value,
          ta.selectionStart,
          ta.selectionEnd,
        );
        ta.value = newValue;
        ta.setSelectionRange(newStart, newEnd);
        ta.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    ta.addEventListener("addTargetConnection", (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.connection) {
        this._callbacks.addTargetConnection(ce.detail.connection);
      }
    });
  }
}
