import { TwistyPlayer } from "cubing/twisty";
import { Connection } from "../Connection";
import { CubeNodeViewModel } from "../viewmodels/CubeNodeViewModel";
import { applyMovesFromInput, updateTextboxDimensions } from "../actions/cubeNodeActions";
import {
  normalizeApostrophes,
  separateMoves,
  stripComments,
  validMove,
} from "../utils/moveAlgebra";

export interface MoveTextareaCallbacks {
  addTargetConnection: (connection: Connection) => void;
  showToast: (message: string) => void;
}

export class MoveTextareaView {
  private readonly _vm: CubeNodeViewModel;
  private readonly _id: string;
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
    this._id = vm.id;
    this._twistyPlayer = twistyPlayer;
    this._callbacks = callbacks;

    this._textarea = document.createElement("textarea");
    this._textarea.id = `${this._id}-move-input`;
    this._textarea.classList.add("move-input");
    this._textarea.style.flexGrow = "1";

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

      // Auto-close parentheses
      if (cursor > 0 && cur.length > previousValue.length && cur[cursor - 1] === "(") {
        ta.value = cur.slice(0, cursor) + ")" + cur.slice(cursor);
        ta.selectionStart = ta.selectionEnd = cursor;
      }
      // Skip over closing paren if already there
      if (
        cursor > 0 &&
        cur.length > previousValue.length &&
        cur[cursor - 1] === ")" &&
        cursor < cur.length &&
        cur[cursor] === ")"
      ) {
        ta.value = cur.slice(0, cursor) + cur.slice(cursor + 1);
        ta.selectionStart = ta.selectionEnd = cursor;
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
      const preview = document.getElementById(`${this._id}-text-preview`);
      if (preview && this._vm.isMinimized.get()) {
        const firstLine = ta.value.split("\n")[0] ?? "";
        preview.textContent =
          firstLine.length > 30 ? firstLine.substring(0, 27) + "..." : firstLine || "(Empty)";
      }
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
        const val = ta.value;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const lines = val.split("\n");
        const startLine = val.substring(0, start).split("\n").length - 1;
        const endLine = val.substring(0, end).split("\n").length - 1;
        const allCommented = lines
          .slice(startLine, endLine + 1)
          .every((l) => l.trimStart().startsWith("//"));

        for (let i = startLine; i <= endLine; i++) {
          if (allCommented) {
            if (lines[i].trimStart().startsWith("//")) {
              const indent = lines[i].length - lines[i].trimStart().length;
              lines[i] = lines[i].substring(0, indent) + lines[i].substring(indent + 2);
            }
          } else {
            lines[i] = "//" + lines[i];
          }
        }

        ta.value = lines.join("\n");
        ta.setSelectionRange(
          start,
          end + (allCommented ? -2 : 2) * (endLine - startLine + 1),
        );
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
