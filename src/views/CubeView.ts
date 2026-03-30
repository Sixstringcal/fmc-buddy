import { TwistyPlayer } from "cubing/twisty";
import { Connection } from "../Connection";
import { CubeNodeViewModel } from "../viewmodels/CubeNodeViewModel";
import type { AppViewModel } from "../viewmodels/AppViewModel";
import {
  applyMovesFromInput,
  deleteNode,
  duplicateEOEntry,
  duplicateNode,
  finishNode,
  markAsBad,
  markAsGood,
  selectEO,
  setSecretRotation,
  toggleEOView,
  toggleMinimized,
  toggleMode,
  updateEOEntry,
  addEOEntry,
  updatePosition,
  updateTextboxDimensions,
} from "../actions/cubeNodeActions";
import { normalizeApostrophes, separateMoves, stripComments, validMove } from "../utils/moveAlgebra";

const BLUE = "#007bff";
const ORANGE = "#ffa500";

export class CubeView {
  private readonly _vm: CubeNodeViewModel;
  private readonly _appVm: AppViewModel;
  private readonly _twistyPlayer: TwistyPlayer;

  private _sourceConnections: Connection[] = [];
  private _targetConnections: Connection[] = [];

  private static _connectionsLoaded = false;

  constructor(
    appVm: AppViewModel,
    vm: CubeNodeViewModel,
  ) {
    this._appVm = appVm;
    this._vm = vm;
    this._twistyPlayer = new TwistyPlayer({
      puzzle: "3x3x3",
      background: "none",
      controlPanel: "none",
      cameraLatitudeLimit: 99999999,
    });
  }

  initialize(): void {
    const container = this._ensureContainer();
    this._buildControls(container);
    this._buildInputSection(container);
    this._bindObservables(container);
    this._bindContainerFocus(container);
  }

  getContainerId(): string {
    return this._vm.id;
  }

  updateScramble(scramble: string): void {
    this._vm.scramble.set(scramble);
  }

  createConnectionFromState(targetId: string): void {
    this._addConnection(this._vm.id, targetId);
  }

  forceUpdateConnections(): void {
    for (const c of this._sourceConnections) {
      c.updatePosition();
      c.setVisible(true);
    }
    for (const c of this._targetConnections) {
      c.updatePosition();
      c.setVisible(true);
    }
  }

  initializeConnections(): void {
    this.forceUpdateConnections();
  }

  addTargetConnection(connection: Connection): void {
    this._targetConnections.push(connection);
  }

  static markConnectionsLoaded(): void {
    CubeView._connectionsLoaded = true;
  }

  saveState(): void { }

  private _ensureContainer(): HTMLElement {
    let container = document.getElementById(this._vm.id);
    if (!container) {
      container = document.createElement("div");
      container.id = this._vm.id;
      container.classList.add("cube-container");
      document.body.appendChild(container);
    }

    const pos = this._vm.position.get();
    container.style.left = `${pos.left}px`;
    container.style.top = `${pos.top}px`;

    container.addEventListener("mousedown", () => {
      document.querySelectorAll<HTMLElement>(".cube-container").forEach(
        (el) => (el.style.zIndex = "1"),
      );
      container!.style.zIndex = "10";
    });

    return container;
  }

  private _buildControls(container: HTMLElement): void {
    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.id = `${this._vm.id}-delete-button`;
    deleteBtn.textContent = "×";
    deleteBtn.classList.add("delete-button");
    deleteBtn.title = "Delete this cube view";
    deleteBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to delete this cube view?")) {
        this._removeConnections();
        deleteNode(this._vm, this._appVm);
        container.remove();
      }
    });
    container.appendChild(deleteBtn);

    // Minimize button
    const minBtn = document.createElement("button");
    minBtn.id = `${this._vm.id}-minimize-button`;
    minBtn.classList.add("minimize-button");
    minBtn.innerHTML = "−";
    minBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMinimized(this._vm);
    });
    container.appendChild(minBtn);

    // Drag icon
    const dragIcon = document.createElement("div");
    dragIcon.id = `${this._vm.id}-drag-icon`;
    dragIcon.classList.add("drag-icon");
    dragIcon.innerHTML = "&#x2807;";
    container.appendChild(dragIcon);

    this._setupDrag(dragIcon, container);

    // Column wrapper hosts the rest of the UI
    const colWrap = document.createElement("div");
    colWrap.id = `${this._vm.id}-column-wrapper`;
    colWrap.classList.add("column-wrapper");
    container.appendChild(colWrap);

    // Move counter
    const moveCounter = document.createElement("div");
    moveCounter.id = `${this._vm.id}-move-counter`;
    moveCounter.classList.add("move-counter");
    moveCounter.textContent = "Moves: 0";
    colWrap.appendChild(moveCounter);

    // Normal/Inverse toggle
    const toggleBtn = document.createElement("button");
    toggleBtn.id = `${this._vm.id}-toggle-button`;
    toggleBtn.classList.add("toggle-button", "button");
    toggleBtn.addEventListener("click", () => toggleMode(this._vm));
    colWrap.appendChild(toggleBtn);

    // Rotation buttons
    const rotContainer = document.createElement("div");
    rotContainer.id = `${this._vm.id}-rotation-buttons`;
    rotContainer.classList.add("rotation-button-container");
    colWrap.appendChild(rotContainer);

    const rotations: Array<{ label: string; key: string }> = [
      { label: "x", key: "x" },
      { label: "x'", key: "x'" },
      { label: "z", key: "z" },
      { label: "z'", key: "z'" },
    ];
    for (const { label, key } of rotations) {
      const btn = document.createElement("button");
      btn.id = `${this._vm.id}-rotation-${label.replace("'", "prime")}-button`;
      btn.textContent = label;
      btn.classList.add("rotation-button", "button");
      btn.addEventListener("click", () => setSecretRotation(this._vm, key));
      rotContainer.appendChild(btn);
    }

    // Twisty player
    container.insertBefore(this._twistyPlayer, colWrap);

    // Rating wrapper
    const ratingWrap = document.createElement("div");
    ratingWrap.id = `${this._vm.id}-rating-wrapper`;
    ratingWrap.classList.add("rating-wrapper");
    ratingWrap.style.cssText = "display:flex;justify-content:center;margin-top:10px;";

    // Thumbs up button
    const thumbsUp = document.createElement("button");
    thumbsUp.innerHTML = "👍";
    thumbsUp.classList.add("rating-button", "thumbs-up");
    thumbsUp.style.marginRight = "10px";
    thumbsUp.addEventListener("click", () => markAsGood(this._vm));
    ratingWrap.appendChild(thumbsUp);

    // Thumbs down button
    const thumbsDown = document.createElement("button");
    thumbsDown.innerHTML = "👎";
    thumbsDown.classList.add("rating-button", "thumbs-down");
    thumbsDown.addEventListener("click", () => markAsBad(this._vm));
    ratingWrap.appendChild(thumbsDown);

    colWrap.appendChild(ratingWrap);
  }

  private _buildInputSection(container: HTMLElement): void {
    const colWrap = document.getElementById(`${this._vm.id}-column-wrapper`)!;

    const inputWrap = document.createElement("div");
    inputWrap.id = `${this._vm.id}-input-wrapper`;
    inputWrap.style.cssText = "display:flex;flex-direction:row;align-items:flex-start;width:100%;";
    colWrap.appendChild(inputWrap);

    const eoSwitchWrapper = document.createElement("div");
    eoSwitchWrapper.style.cssText = "display:flex;align-items:center;margin-right:8px;height:32px;";

    const eoLabel = document.createElement("span");
    eoLabel.textContent = "EO";
    eoLabel.className = "eo-switch-label";
    eoLabel.style.cssText = "margin-right:6px;font-weight:bold;font-size:1rem;";
    eoSwitchWrapper.appendChild(eoLabel);

    const eoSwitch = document.createElement("label");
    eoSwitch.id = `${this._vm.id}-eo-switch`;
    eoSwitch.className = "eo-switch-outer";
    eoSwitch.title = "Toggle EO View";
    eoSwitch.innerHTML = `<input type="checkbox" class="eo-switch-checkbox" style="display:none;"><span class="eo-switch-slider"></span>`;
    eoSwitch.querySelector("input")!.addEventListener("change", () =>
      toggleEOView(this._vm),
    );
    eoSwitchWrapper.appendChild(eoSwitch);
    inputWrap.appendChild(eoSwitchWrapper);

    const textarea = document.createElement("textarea");
    textarea.id = `${this._vm.id}-move-input`;
    textarea.classList.add("move-input");
    textarea.style.flexGrow = "1";
    this._initTextarea(textarea);
    inputWrap.appendChild(textarea);

    const eoListWrapper = document.createElement("div");
    eoListWrapper.id = `${this._vm.id}-eo-list-wrapper`;
    eoListWrapper.className = "eo-list-wrapper";
    eoListWrapper.style.display = "none";
    eoListWrapper.addEventListener("mouseup", () => {
      updateTextboxDimensions(
        this._vm,
        eoListWrapper.offsetWidth,
        eoListWrapper.offsetHeight,
      );
    });
    eoListWrapper.addEventListener("touchend", () => {
      updateTextboxDimensions(
        this._vm,
        eoListWrapper.offsetWidth,
        eoListWrapper.offsetHeight,
      );
    });
    inputWrap.insertBefore(eoListWrapper, textarea);

    const dims = this._vm.textboxDimensions.get();
    if (dims) {
      textarea.style.width = `${dims.width}px`;
      textarea.style.height = `${dims.height}px`;
      eoListWrapper.style.width = `${dims.width}px`;
      eoListWrapper.style.height = `${dims.height}px`;
    }

    const dupBtn = document.createElement("button");
    dupBtn.id = `${this._vm.id}-duplicate-button`;
    dupBtn.textContent = "+";
    dupBtn.classList.add("duplicate-button");
    dupBtn.title = "Duplicate this cube view";
    dupBtn.addEventListener("click", () => this._onDuplicate());
    inputWrap.appendChild(dupBtn);

    const finBtn = document.createElement("button");
    finBtn.id = `${this._vm.id}-finish-button`;
    finBtn.textContent = "✔";
    finBtn.classList.add("finish-button");
    finBtn.title = "Finish this cube view";
    finBtn.addEventListener("click", () => this._onFinish());
    inputWrap.appendChild(finBtn);

    textarea.addEventListener("mouseup", () => {
      updateTextboxDimensions(this._vm, textarea.offsetWidth, textarea.offsetHeight);
    });
    textarea.addEventListener("touchend", () => {
      updateTextboxDimensions(this._vm, textarea.offsetWidth, textarea.offsetHeight);
    });
  }

  private _bindObservables(container: HTMLElement): void {
    const vm = this._vm;

    vm.playerAlg.subscribe((alg) => {
      this._twistyPlayer.alg = alg;
    });

    vm.moveCount.subscribe((count) => {
      const el = document.getElementById(`${vm.id}-move-counter`);
      if (el) el.textContent = `Moves: ${count}`;
    });

    vm.isNormal.subscribe((normal) => {
      const btn = document.getElementById(`${vm.id}-toggle-button`) as HTMLButtonElement | null;
      if (btn) {
        btn.textContent = normal ? "Normal" : "Inverse";
        btn.style.backgroundColor = normal ? BLUE : ORANGE;
      }
    });

    vm.isGood.subscribe((good) => {
      const up = container.querySelector<HTMLElement>(".thumbs-up");
      const dn = container.querySelector<HTMLElement>(".thumbs-down");
      up?.classList.remove("active");
      dn?.classList.remove("active");
      if (good === true) {
        container.style.backgroundColor = "lightgreen";
        up?.classList.add("active");
      } else if (good === false) {
        container.style.backgroundColor = "lightcoral";
        dn?.classList.add("active");
      } else {
        container.style.backgroundColor = "";
      }
    });

    vm.isMinimized.subscribe((minimized) => this._renderMinimized(minimized, container));

    vm.secretRotation.subscribe((active) => {
      const map: Record<string, string> = {
        x: `${vm.id}-rotation-x-button`,
        "x'": `${vm.id}-rotation-xprime-button`,
        z: `${vm.id}-rotation-z-button`,
        "z'": `${vm.id}-rotation-zprime-button`,
      };
      for (const [key, id] of Object.entries(map)) {
        const btn = document.getElementById(id) as HTMLButtonElement | null;
        if (!btn) continue;
        if (key === active) {
          btn.style.backgroundColor = BLUE;
          btn.style.color = "white";
        } else {
          btn.style.backgroundColor = "";
          btn.style.color = BLUE;
        }
      }
    });

    vm.isEOView.subscribe((isEO) => this._renderEOViewToggle(isEO, container));

    const renderEO = () => this._renderEOList();
    vm.eoList.subscribe(renderEO);
    vm.selectedEOIndex.subscribe(renderEO);
  }

  private _renderMinimized(minimized: boolean, container: HTMLElement): void {
    const minBtn = document.getElementById(`${this._vm.id}-minimize-button`);
    const dragIcon = document.getElementById(`${this._vm.id}-drag-icon`);

    if (minimized) {
      if (minBtn) {
        minBtn.innerHTML = "+";
        minBtn.classList.add("maximize-button");
        minBtn.classList.remove("minimize-button");
      }
      if (dragIcon) dragIcon.style.display = "none";

      let preview = document.getElementById(`${this._vm.id}-text-preview`);
      if (!preview) {
        preview = document.createElement("div");
        preview.id = `${this._vm.id}-text-preview`;
        preview.classList.add("text-preview");
        preview.addEventListener("click", () => toggleMinimized(this._vm));
        container.appendChild(preview);
      }
      preview.style.display = "block";

      const raw = this._vm.rawMoves.get();
      const firstLine = raw.split("\n")[0] ?? "";
      preview.textContent =
        firstLine.length > 30 ? firstLine.substring(0, 27) + "..." : firstLine || "(Empty)";

      for (const child of Array.from(container.children) as HTMLElement[]) {
        if (
          child.id !== `${this._vm.id}-minimize-button` &&
          child.id !== `${this._vm.id}-text-preview` &&
          child.id !== `${this._vm.id}-drag-icon`
        ) {
          child.style.display = "none";
        }
      }
      container.classList.add("cube-container-minimized");
      this._makeContainerDraggable(container);
    } else {
      if (minBtn) {
        minBtn.innerHTML = "−";
        minBtn.classList.add("minimize-button");
        minBtn.classList.remove("maximize-button");
      }
      if (dragIcon) dragIcon.style.display = "";

      const preview = document.getElementById(`${this._vm.id}-text-preview`);
      if (preview) preview.style.display = "none";

      for (const child of Array.from(container.children) as HTMLElement[]) {
        if (child.id !== `${this._vm.id}-text-preview`) {
          (child as HTMLElement).style.display = "";
        }
      }
      container.classList.remove("cube-container-minimized");
    }
  }

  private _renderEOViewToggle(isEO: boolean, _container: HTMLElement): void {
    const textarea = document.getElementById(`${this._vm.id}-move-input`) as HTMLTextAreaElement | null;
    const eoWrap = document.getElementById(`${this._vm.id}-eo-list-wrapper`);
    const eoSwitch = document.getElementById(`${this._vm.id}-eo-switch`);
    const counter = document.getElementById(`${this._vm.id}-move-counter`);

    if (isEO) {
      if (textarea) textarea.style.display = "none";
      if (eoWrap) eoWrap.style.display = "";
      if (eoSwitch) (eoSwitch.querySelector("input") as HTMLInputElement).checked = true;
      if (counter) counter.style.display = "none";
      if (this._vm.eoList.get().length === 0) {
        addEOEntry(this._vm);
      }
    } else {
      if (textarea) textarea.style.display = "";
      if (eoWrap) eoWrap.style.display = "none";
      if (eoSwitch) (eoSwitch.querySelector("input") as HTMLInputElement).checked = false;
      if (counter) counter.style.display = "";
    }
    this._renderEOList();
  }

  private _renderEOList(): void {
    const wrapper = document.getElementById(
      `${this._vm.id}-eo-list-wrapper`,
    ) as HTMLDivElement | null;
    if (!wrapper) return;
    if (wrapper.querySelector(".eo-edit-input")) return;
    wrapper.innerHTML = "";
    if (!this._vm.isEOView.get()) return;

    const eoList = this._vm.eoList.get();
    const selectedIdx = this._vm.selectedEOIndex.get();

    const indexed = eoList
      .map((eo, idx) => ({ eo, idx }))
      .sort((a, b) => {
        const ca = this._countMovesForDisplay(a.eo);
        const cb = this._countMovesForDisplay(b.eo);
        return ca !== cb ? ca - cb : a.idx - b.idx;
      });

    for (let rank = 0; rank < indexed.length; rank++) {
      const { eo, idx } = indexed[rank];
      const row = document.createElement("div");
      row.classList.add("eo-row");
      if (idx === selectedIdx) row.style.background = "#e0e0e0";
      row.textContent = eo || "(Double click to edit)";
      row.title = eo;

      const capturedRank = rank;
      let clickTimeout: ReturnType<typeof setTimeout> | null = null;
      row.addEventListener("click", () => {
        if (clickTimeout !== null) {
          clearTimeout(clickTimeout);
          clickTimeout = null;
          this._editEORow(idx, capturedRank, wrapper);
        } else {
          clickTimeout = setTimeout(() => {
            selectEO(this._vm, idx);
            clickTimeout = null;
          }, 200);
        }
      });
      wrapper.appendChild(row);
    }

    const addRow = document.createElement("div");
    addRow.className = "eo-add-row";
    const addBtn = document.createElement("button");
    addBtn.textContent = "+";
    addBtn.title = "Add EO";
    addBtn.className = "eo-add-button";
    addBtn.addEventListener("click", () => addEOEntry(this._vm));
    addRow.appendChild(addBtn);
    wrapper.appendChild(addRow);
  }

  private _editEORow(idx: number, rank: number, wrapper: HTMLElement): void {
    const input = document.createElement("input");
    input.type = "text";
    input.value = this._vm.eoList.get()[idx] ?? "";
    input.className = "eo-edit-input";
    let cancelled = false;
    input.addEventListener("blur", () => {
      if (!cancelled) updateEOEntry(this._vm, idx, input.value);
      input.classList.remove("eo-edit-input");
      this._renderEOList();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { input.blur(); }
      if (e.key === "Escape") { cancelled = true; input.blur(); }
    });
    const rows = wrapper.querySelectorAll(".eo-row");
    if (rows[rank]) {
      wrapper.replaceChild(input, rows[rank]);
    }
    input.focus();
  }

  private _initTextarea(textarea: HTMLTextAreaElement): void {
    const saved = this._vm.rawMoves.get();
    if (saved) textarea.value = saved;

    let previousValue = textarea.value;

    textarea.addEventListener("input", () => {
      const cursor = textarea.selectionStart;
      const cur = textarea.value;

      if (cursor > 0 && cur.length > previousValue.length && cur[cursor - 1] === "(") {
        textarea.value =
          cur.slice(0, cursor) + ")" + cur.slice(cursor);
        textarea.selectionStart = textarea.selectionEnd = cursor;
      }
      if (
        cursor > 0 &&
        cur.length > previousValue.length &&
        cur[cursor - 1] === ")" &&
        cursor < cur.length &&
        cur[cursor] === ")"
      ) {
        textarea.value = cur.slice(0, cursor) + cur.slice(cursor + 1);
        textarea.selectionStart = textarea.selectionEnd = cursor;
      }

      previousValue = textarea.value;
      const movesUpToCursor = textarea.value.substring(0, textarea.selectionStart);
      applyMovesFromInput(this._vm, textarea.value);
      const cleaned = normalizeApostrophes(stripComments(textarea.value));
      const { normalMoves, inverseMoves } = separateMoves(cleaned);
      for (const t of [...normalMoves.split(/\s+/), ...inverseMoves.split(/\s+/)].filter(Boolean)) {
        if (!validMove(t)) this._showToast(`Invalid move: ${t}`);
      }
      this._twistyPlayer.alg = this._vm.computePreviewAlg(movesUpToCursor);
      const preview = document.getElementById(`${this._vm.id}-text-preview`);
      if (preview && this._vm.isMinimized.get()) {
        const firstLine = textarea.value.split("\n")[0] ?? "";
        preview.textContent =
          firstLine.length > 30 ? firstLine.substring(0, 27) + "..." : firstLine || "(Empty)";
      }
    });

    textarea.addEventListener("click", () => {
      const movesUpToCursor = textarea.value.substring(0, textarea.selectionStart);
      this._twistyPlayer.alg = this._vm.computePreviewAlg(movesUpToCursor);
    });

    const arrowKeys = new Set([
      "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End",
    ]);
    textarea.addEventListener("keyup", (e) => {
      if (arrowKeys.has(e.key)) {
        const movesUpToCursor = textarea.value.substring(0, textarea.selectionStart);
        this._twistyPlayer.alg = this._vm.computePreviewAlg(movesUpToCursor);
      }
    });

    // Toggle comments
    textarea.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        const val = textarea.value;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
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

        textarea.value = lines.join("\n");
        textarea.setSelectionRange(
          start,
          end + (allCommented ? -2 : 2) * (endLine - startLine + 1),
        );
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    textarea.addEventListener("addTargetConnection", (e: CustomEvent) => {
      if (e.detail?.connection) {
        this.addTargetConnection(e.detail.connection);
      }
    });
  }

  private _setupDrag(handle: HTMLElement, container: HTMLElement): void {
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const onMove = (clientX: number, clientY: number) => {
      if (!isDragging) return;
      const sx = window.pageXOffset || document.documentElement.scrollLeft;
      const sy = window.pageYOffset || document.documentElement.scrollTop;
      const left = clientX + sx - offsetX;
      const top = clientY + sy - offsetY;
      container.style.left = `${left}px`;
      container.style.top = `${top}px`;
      this._checkAndScroll(clientX, clientY);
      this._updateConnections();
      this._ensureDocumentSize();
    };

    const onUp = () => {
      if (!isDragging) return;
      isDragging = false;
      document.body.classList.remove("grabbing");
      const rect = container.getBoundingClientRect();
      const sx = window.pageXOffset || document.documentElement.scrollLeft;
      const sy = window.pageYOffset || document.documentElement.scrollTop;
      updatePosition(this._vm, rect.left + sx, rect.top + sy);
      this._updateConnections();
      Connection.updateConnectionsIntersectingCubeView(this._vm.id);
      this._ensureDocumentSize();

      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onMouseUp = () => onUp();

    handle.addEventListener("mousedown", (e) => {
      if (!CubeView._connectionsLoaded) return;
      isDragging = true;
      const r = container.getBoundingClientRect();
      offsetX = e.clientX - r.left;
      offsetY = e.clientY - r.top;
      document.body.classList.add("grabbing");
      container.style.zIndex = "100";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      e.preventDefault();
    });

    handle.addEventListener("touchstart", (e) => {
      isDragging = true;
      const touch = e.touches[0];
      const r = container.getBoundingClientRect();
      offsetX = touch.clientX - r.left;
      offsetY = touch.clientY - r.top;
      container.style.zIndex = "100";
      e.preventDefault();
    });

    document.addEventListener("touchmove", (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      onMove(touch.clientX, touch.clientY);
      Connection.updateConnectionsIntersectingCubeView(this._vm.id);
      e.preventDefault();
    });

    document.addEventListener("touchend", () => {
      if (!isDragging) return;
      isDragging = false;
      this._updateConnections();
      Connection.updateConnectionsIntersectingCubeView(this._vm.id);
    });

    document.addEventListener("touchcancel", () => {
      isDragging = false;
    });
  }

  private _makeContainerDraggable(container: HTMLElement): void {
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.id === `${this._vm.id}-minimize-button`) return;
      if (!this._vm.isMinimized.get()) return;

      container.classList.add("grabbing");
      container.style.zIndex = "100";
      const r = container.getBoundingClientRect();
      const ox = e.clientX - r.left;
      const oy = e.clientY - r.top;

      const onMove = (me: MouseEvent) => {
        const sx = window.pageXOffset || document.documentElement.scrollLeft;
        const sy = window.pageYOffset || document.documentElement.scrollTop;
        container.style.left = `${me.clientX + sx - ox}px`;
        container.style.top = `${me.clientY + sy - oy}px`;
        this._checkAndScroll(me.clientX, me.clientY);
        this._updateConnections();
        Connection.updateConnectionsIntersectingCubeView(this._vm.id);
        this._ensureDocumentSize();
        me.preventDefault();
      };
      const onUp = () => {
        container.classList.remove("grabbing");
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        this._updateConnections();
        Connection.updateConnectionsIntersectingCubeView(this._vm.id);
        this._ensureDocumentSize();
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      e.preventDefault();
    };

    container.addEventListener("mousedown", onMouseDown);
    container.style.cursor = "grab";
  }

  private _bindContainerFocus(container: HTMLElement): void {
    container.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "BUTTON" ||
        target.tagName === "TEXTAREA" ||
        target.id === `${this._vm.id}-drag-icon` ||
        target.closest(".twisty-player-component") ||
        target.classList.contains("rating-button") ||
        target.classList.contains("text-preview")
      ) {
        return;
      }
      const textarea = document.getElementById(
        `${this._vm.id}-move-input`,
      ) as HTMLTextAreaElement | null;
      if (textarea && !this._vm.isMinimized.get()) {
        textarea.focus();
      }
    });
  }

  private _onDuplicate(): void {
    if (this._vm.isEOView.get()) {
      const newVm = duplicateEOEntry(this._vm, this._appVm);
      this._spawnChildView(newVm);
      return;
    }
    const textarea = document.getElementById(
      `${this._vm.id}-move-input`,
    ) as HTMLTextAreaElement | null;
    const start = textarea?.selectionStart ?? 0;
    const end = textarea?.selectionEnd ?? 0;
    const newVm = duplicateNode(this._vm, this._appVm, start, end);
    this._spawnChildView(newVm);
  }

  private _onFinish(): void {
    const newVm = finishNode(this._vm, this._appVm);
    this._spawnChildView(newVm);
  }

  private _spawnChildView(childVm: CubeNodeViewModel): void {
    const view = new CubeView(this._appVm, childVm);
    view.initialize();

    const parentContainer = document.getElementById(this._vm.id);
    const childContainer = document.getElementById(childVm.id);

    if (parentContainer && childContainer) {
      const pos = this._findNonOverlappingPosition(parentContainer);
      childContainer.style.position = "absolute";
      childContainer.style.top = `${pos.top}px`;
      childContainer.style.left = `${pos.left}px`;
      updatePosition(childVm, pos.left, pos.top);

      this._addConnection(this._vm.id, childVm.id);
      this._ensureDocumentSize();
    }
  }

  private _addConnection(sourceId: string, targetId: string): void {
    const from = document.getElementById(sourceId);
    const to = document.getElementById(targetId);
    if (!from || !to) return;

    const already = this._sourceConnections.some(
      (c) => c.getSourceId() === sourceId && c.getTargetId() === targetId,
    );
    if (already) return;

    const conn = new Connection(sourceId, targetId);
    conn.setVisible(true);
    this._sourceConnections.push(conn);

    const targetTextarea = document.getElementById(`${targetId}-move-input`);
    if (targetTextarea) {
      targetTextarea.dispatchEvent(
        new CustomEvent("addTargetConnection", { detail: { connection: conn } }),
      );
    }

    this._appVm.addConnection({ sourceId, targetId });
    conn.updatePosition();
  }

  private _updateConnections(): void {
    for (const c of this._sourceConnections) c.updatePosition();
    for (const c of this._targetConnections) c.updatePosition();
  }

  private _removeConnections(): void {
    for (const c of this._sourceConnections) c.remove();
    for (const c of this._targetConnections) c.remove();
    this._sourceConnections = [];
    this._targetConnections = [];
  }

  private _checkAndScroll(clientX: number, clientY: number): void {
    const speed = 15;
    const edge = 50;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (clientX > vw - edge) window.scrollBy(speed, 0);
    else if (clientX < edge) window.scrollBy(-speed, 0);
    if (clientY > vh - edge) window.scrollBy(0, speed);
    else if (clientY < edge) window.scrollBy(0, -speed);
  }

  private _ensureDocumentSize(): void {
    const containers = document.querySelectorAll<HTMLElement>(".cube-container");
    let maxRight = window.innerWidth;
    let maxBottom = window.innerHeight;

    for (const el of Array.from(containers)) {
      const r = el.getBoundingClientRect();
      maxRight = Math.max(maxRight, r.right + window.scrollX + 300);
      maxBottom = Math.max(maxBottom, r.bottom + window.scrollY + 300);
    }

    document.documentElement.style.minWidth = `${maxRight}px`;
    document.documentElement.style.minHeight = `${maxBottom}px`;
    document.body.style.minWidth = `${maxRight}px`;
    document.body.style.minHeight = `${maxBottom}px`;
  }

  private _findNonOverlappingPosition(origin: HTMLElement): {
    left: number;
    top: number;
  } {
    const r = origin.getBoundingClientRect();
    const sx = window.pageXOffset || document.documentElement.scrollLeft;
    const sy = window.pageYOffset || document.documentElement.scrollTop;
    const w = r.width;
    const h = r.height;
    const spacing = 20;
    const all = Array.from(
      document.querySelectorAll<HTMLElement>(".cube-container"),
    );
    const minLeft = Math.max(0, sx);
    const minTop = Math.max(0, sy);

    for (let attempt = 1; attempt <= 5; attempt++) {
      const pos = {
        left: Math.max(minLeft, r.right + sx + spacing * attempt),
        top: Math.max(minTop, r.top + sy),
      };
      if (!this._isOverlapping(pos, w, h, all, origin)) return pos;
    }

    const dirs = [
      { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 },
      { dx: -1, dy: 0 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
    ];
    let x = 0, y = 0;
    for (let attempt = 0; attempt < 20; attempt++) {
      for (const { dx, dy } of dirs) {
        const steps = dx > 0 ? 3 : 1;
        for (let s = 1; s <= steps; s++) {
          x += dx;
          y += dy;
          const pos = {
            left: Math.max(minLeft, r.left + sx + x * (w + spacing)),
            top: Math.max(minTop, r.top + sy + y * (h + spacing / 2)),
          };
          if (!this._isOverlapping(pos, w, h, all, origin)) return pos;
        }
      }
    }

    return {
      left: Math.max(minLeft, r.right + sx + spacing * 2),
      top: Math.max(minTop, r.bottom + sy + spacing),
    };
  }

  private _isOverlapping(
    pos: { left: number; top: number },
    w: number,
    h: number,
    containers: HTMLElement[],
    exclude: HTMLElement,
  ): boolean {
    const p = { left: pos.left, right: pos.left + w, top: pos.top, bottom: pos.top + h };
    for (const el of containers) {
      if (el === exclude) continue;
      const r = el.getBoundingClientRect();
      const sx = window.pageXOffset || document.documentElement.scrollLeft;
      const sy = window.pageYOffset || document.documentElement.scrollTop;
      const c = {
        left: r.left + sx, right: r.right + sx,
        top: r.top + sy, bottom: r.bottom + sy,
      };
      if (!(p.right < c.left || p.left > c.right || p.bottom < c.top || p.top > c.bottom)) {
        return true;
      }
    }
    return false;
  }

  private _showToast(message: string): void {
    const toastId = `${this._vm.id}-toast`;
    let toast = document.getElementById(toastId);
    if (!toast) {
      toast = document.createElement("div");
      toast.id = toastId;
      toast.classList.add("toast");
      const container = document.getElementById(this._vm.id);
      if (container) container.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast!.classList.remove("show"), 3000);
  }

  private _countMovesForDisplay(eo: string): number {
    // Inline here to avoid circular import; mirrors countMoves() in moveAlgebra.
    const COUNTABLE = /^(R|L|F|B|U|D|Rw|Lw|Fw|Bw|Uw|Dw)(2|'|w2|w')?$/;
    if (!eo.trim()) return 0;
    return eo
      .split(/\s+/)
      .filter((t) => COUNTABLE.test(t))
      .length;
  }
}
