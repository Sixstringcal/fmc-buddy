import { TwistyPlayer } from "cubing/twisty";
import { Connection } from "../Connection";
import { CubeNodeViewModel } from "../viewmodels/CubeNodeViewModel";
import type { AppViewModel } from "../viewmodels/AppViewModel";
import {
  deleteNode,
  duplicateEOEntry,
  duplicateNode,
  finishNode,
  toggleMinimized,
  updatePosition,
} from "../actions/cubeNodeActions";
import { CubeControlsView } from "./CubeControlsView";
import { CubeInputView } from "./CubeInputView";

export class CubeView {
  private readonly _vm: CubeNodeViewModel;
  private readonly _appVm: AppViewModel;
  private readonly _twistyPlayer: TwistyPlayer;

  private _sourceConnections: Connection[] = [];
  private _targetConnections: Connection[] = [];
  private _controlsView!: CubeControlsView;
  private _inputView!: CubeInputView;

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
    this._buildHeaderControls(container);

    const colWrap = document.createElement("div");
    colWrap.id = `${this._vm.id}-column-wrapper`;
    colWrap.classList.add("column-wrapper");
    container.appendChild(colWrap);

    this._controlsView = new CubeControlsView(this._vm);
    this._controlsView.appendTo(colWrap);

    container.insertBefore(this._twistyPlayer, colWrap);

    this._inputView = new CubeInputView(this._vm, this._twistyPlayer, {
      onDuplicate: () => this._onDuplicate(),
      onFinish: () => this._onFinish(),
      addTargetConnection: (c) => this.addTargetConnection(c),
      showToast: (msg) => this._showToast(msg),
    });
    this._inputView.appendTo(colWrap);

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

  private _buildHeaderControls(container: HTMLElement): void {
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
  }

  private _bindObservables(container: HTMLElement): void {
    this._vm.playerAlg.subscribe((alg) => {
      this._twistyPlayer.alg = alg;
    });
    this._vm.isMinimized.subscribe((minimized) =>
      this._renderMinimized(minimized, container),
    );
    const counter = document.getElementById(`${this._vm.id}-move-counter`)!;
    this._controlsView.bindObservables(container);
    this._inputView.bindObservables(counter);
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
    const textarea = this._inputView.getTextarea();
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

}
