import { TwistyPlayer } from "cubing/twisty";
import { Connection } from "./Connection";
import { saveState, loadState } from "./stateManager";

const validMoveRegex = /^(R|L|F|B|U|D|x|y|z|Rw|Lw|Fw|Bw|Uw|Dw)(2|'|w2|w')?$/;
const countableMoveRegex = /^(R|L|F|B|U|D|Rw|Lw|Fw|Bw|Uw|Dw)(2|'|w2|w')?$/;

const BLUE = "#007bff";
const ORANGE = "#ffa500";

interface CubeViewState {
  id: string;
  moves: string;
  position: {
    left: number;
    top: number;
  };
  isMinimized: boolean;
  isNormal: boolean;
  secretRotation: string;
  isGood: boolean | null;
  textboxDimensions?: {
    width: number;
    height: number;
  };
  isEOView?: boolean;
  eoList?: string[];
  selectedEOIndex?: number;
}

interface AppState {
  cubeViewCount: number;
  cubeViews: CubeViewState[];
  connections: {
    sourceId: string;
    targetId: string;
  }[];
  scramble: string;
}

export class CubeView {
  private scramble: string;
  private inverseMoves: string = "";
  private normalMoves: string = "";
  private twistyPlayer: TwistyPlayer;
  private previousMoves: string = "";
  private containerId: string;
  private isNormal: boolean = true;
  private isMinimized: boolean = false;
  private secretRotation: string = "";
  private isGood: boolean | null = null;
  private isEOView: boolean = false;
  private eoList: string[] = [];
  private selectedEOIndex: number = 0;

  private sourceConnections: Connection[] = [];
  private targetConnections: Connection[] = [];

  private static connectionsLoaded = false;

  constructor(scramble: string, containerId: string, state?: CubeViewState) {
    this.scramble = scramble;
    this.containerId = containerId;
    this.twistyPlayer = new TwistyPlayer({
      puzzle: "3x3x3",
      background: "none",
      controlPanel: "none",
      cameraLatitudeLimit: 99999999,
    });

    if (state) {
      this.previousMoves = state.moves;
      this.isNormal = state.isNormal;
      this.isMinimized = state.isMinimized;
      this.secretRotation = state.secretRotation;
      this.isGood = state.isGood !== undefined ? state.isGood : null;
      this.isEOView = !!state.isEOView;
      this.eoList = state.eoList || [];
      this.selectedEOIndex = state.selectedEOIndex ?? 0;

      if (state.textboxDimensions) {
        const moveInput = document.getElementById(
          `${this.containerId}-move-input`
        ) as HTMLTextAreaElement;
        if (moveInput) {
          moveInput.style.width = `${state.textboxDimensions.width}px`;
          moveInput.style.height = `${state.textboxDimensions.height}px`;
        }
      }
    }
  }

  initialize() {
    let cubeContainer = document.getElementById(this.containerId);
    if (!cubeContainer) {
      cubeContainer = document.createElement("div");
      cubeContainer.id = this.containerId;
      cubeContainer.classList.add("cube-container");
      document.body.appendChild(cubeContainer);

      cubeContainer.addEventListener("mousedown", () => {
        document.querySelectorAll(".cube-container").forEach((container) => {
          (container as HTMLElement).style.zIndex = "1";
        });
        cubeContainer.style.zIndex = "10";
      });
    }

    const state = this.loadState();
    if (state && state.position) {
      cubeContainer.style.left = `${state.position.left}px`;
      cubeContainer.style.top = `${state.position.top}px`;
    }

    const deleteButtonId = `${this.containerId}-delete-button`;
    let deleteButton = document.getElementById(deleteButtonId);
    if (!deleteButton) {
      deleteButton = document.createElement("button");
      deleteButton.id = deleteButtonId;
      deleteButton.textContent = "×";
      deleteButton.classList.add("delete-button");
      deleteButton.title = "Delete this cube view";

      deleteButton.addEventListener("click", () => this.confirmDelete());
      cubeContainer.appendChild(deleteButton);
    }

    const minimizeButtonId = `${this.containerId}-minimize-button`;
    let minimizeButton = document.getElementById(minimizeButtonId);
    if (!minimizeButton) {
      minimizeButton = document.createElement("button");
      minimizeButton.id = minimizeButtonId;
      minimizeButton.classList.add("minimize-button");
      minimizeButton.innerHTML = "−";
      minimizeButton.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleMinimized();
      });
      cubeContainer.appendChild(minimizeButton);
    }

    const dragIconId = `${this.containerId}-drag-icon`;
    let dragIcon = document.getElementById(dragIconId);
    if (!dragIcon) {
      dragIcon = document.createElement("div");
      dragIcon.id = dragIconId;
      dragIcon.classList.add("drag-icon");
      dragIcon.innerHTML = "&#x2807;";
      cubeContainer.appendChild(dragIcon);

      let isDragging = false;
      let offsetX = 0;
      let offsetY = 0;

      const mouseMoveHandler = (event: MouseEvent) => {
        if (isDragging) {
          const scrollX =
            window.pageXOffset || document.documentElement.scrollLeft;
          const scrollY =
            window.pageYOffset || document.documentElement.scrollTop;
          const newLeft = event.clientX + scrollX - offsetX;
          const newTop = event.clientY + scrollY - offsetY;

          cubeContainer.style.left = `${newLeft}px`;
          cubeContainer.style.top = `${newTop}px`;

          this.checkAndScroll(event.clientX, event.clientY);
          this.updateConnections();
          this.ensureDocumentSize();

          event.preventDefault();
        }
      };

      const mouseUpHandler = () => {
        if (isDragging) {
          isDragging = false;
          document.body.classList.remove("grabbing");

          this.updateConnections();
          Connection.updateConnectionsIntersectingCubeView(this.containerId);
          this.ensureDocumentSize();
          this.saveState();

          document.removeEventListener("mousemove", mouseMoveHandler);
          document.removeEventListener("mouseup", mouseUpHandler);
        }
      };

      const startDragging = (event: MouseEvent) => {
        offsetX = event.clientX - cubeContainer.getBoundingClientRect().left;
        offsetY = event.clientY - cubeContainer.getBoundingClientRect().top;
        document.body.classList.add("grabbing");
        cubeContainer.style.zIndex = "100";

        this.snapshotConnections();
      };

      dragIcon.addEventListener("mousedown", (event) => {
        if (!CubeView.connectionsLoaded) {
          console.warn("Connections still loading, drag operation prevented");
          return;
        }

        isDragging = true;
        startDragging(event);

        document.addEventListener("mousemove", mouseMoveHandler);
        document.addEventListener("mouseup", mouseUpHandler);

        event.preventDefault();
      });

      dragIcon.addEventListener("touchstart", (event) => {
        isDragging = true;
        const touch = event.touches[0];
        offsetX = touch.clientX - cubeContainer.getBoundingClientRect().left;
        offsetY = touch.clientY - cubeContainer.getBoundingClientRect().top;

        cubeContainer.style.zIndex = "100";

        event.preventDefault();
      });

      document.addEventListener("touchmove", (event) => {
        if (isDragging) {
          const touch = event.touches[0];

          const scrollX =
            window.pageXOffset || document.documentElement.scrollLeft;
          const scrollY =
            window.pageYOffset || document.documentElement.scrollTop;

          const newLeft = touch.clientX + scrollX - offsetX;
          const newTop = touch.clientY + scrollY - offsetY;

          cubeContainer.style.left = `${newLeft}px`;
          cubeContainer.style.top = `${newTop}px`;

          this.checkAndScroll(touch.clientX, touch.clientY);
          this.updateConnections();
          Connection.updateConnectionsIntersectingCubeView(this.containerId);
          this.ensureDocumentSize();

          event.preventDefault();
        }
      });

      document.addEventListener("touchend", () => {
        isDragging = false;

        this.updateConnections();
        Connection.updateConnectionsIntersectingCubeView(this.containerId);
      });

      document.addEventListener("touchcancel", () => {
        isDragging = false;
      });
    }

    const columnWrapperId = `${this.containerId}-column-wrapper`;
    let columnWrapper = document.getElementById(columnWrapperId);
    if (!columnWrapper) {
      columnWrapper = document.createElement("div");
      columnWrapper.id = columnWrapperId;
      columnWrapper.classList.add("column-wrapper");
      cubeContainer.appendChild(columnWrapper);
    }

    const moveCounterId = `${this.containerId}-move-counter`;
    let moveCounter = document.getElementById(moveCounterId) as HTMLDivElement;
    if (!moveCounter) {
      moveCounter = document.createElement("div");
      moveCounter.id = moveCounterId;
      moveCounter.classList.add("move-counter");
      moveCounter.textContent = "Moves: 0";
      columnWrapper.appendChild(moveCounter);
    }

    const toggleButtonId = `${this.containerId}-toggle-button`;
    let toggleButton = document.getElementById(
      toggleButtonId
    ) as HTMLButtonElement;
    if (!toggleButton) {
      toggleButton = document.createElement("button");
      toggleButton.id = toggleButtonId;
      toggleButton.textContent = "Normal";
      toggleButton.classList.add("toggle-button", "button");
      toggleButton.addEventListener("click", () =>
        this.toggleMode(toggleButton)
      );
      columnWrapper.appendChild(toggleButton);
    }

    const rotationButtonContainerId = `${this.containerId}-rotation-buttons`;
    let rotationButtonContainer = document.getElementById(
      rotationButtonContainerId
    );
    if (!rotationButtonContainer) {
      rotationButtonContainer = document.createElement("div");
      rotationButtonContainer.id = rotationButtonContainerId;
      rotationButtonContainer.classList.add("rotation-button-container");
      columnWrapper.appendChild(rotationButtonContainer);
    }

    const rotationXButtonId = `${this.containerId}-rotation-x-button`;
    let rotationXButton = document.getElementById(
      rotationXButtonId
    ) as HTMLButtonElement;
    if (!rotationXButton) {
      rotationXButton = document.createElement("button");
      rotationXButton.id = rotationXButtonId;
      rotationXButton.textContent = "x";
      rotationXButton.classList.add("rotation-button", "button");
      rotationXButton.addEventListener("click", () =>
        this.toggleSecretRotation("x")
      );
      rotationButtonContainer.appendChild(rotationXButton);
    }

    const rotationXPrimeButtonId = `${this.containerId}-rotation-xprime-button`;
    let rotationXPrimeButton = document.getElementById(
      rotationXPrimeButtonId
    ) as HTMLButtonElement;
    if (!rotationXPrimeButton) {
      rotationXPrimeButton = document.createElement("button");
      rotationXPrimeButton.id = rotationXPrimeButtonId;
      rotationXPrimeButton.textContent = "x'";
      rotationXPrimeButton.classList.add("rotation-button", "button");
      rotationXPrimeButton.addEventListener("click", () =>
        this.toggleSecretRotation("x'")
      );
      rotationButtonContainer.appendChild(rotationXPrimeButton);
    }

    const rotationZButtonId = `${this.containerId}-rotation-z-button`;
    let rotationZButton = document.getElementById(
      rotationZButtonId
    ) as HTMLButtonElement;
    if (!rotationZButton) {
      rotationZButton = document.createElement("button");
      rotationZButton.id = rotationZButtonId;
      rotationZButton.textContent = "z";
      rotationZButton.classList.add("rotation-button", "button");
      rotationZButton.addEventListener("click", () =>
        this.toggleSecretRotation("z")
      );
      rotationButtonContainer.appendChild(rotationZButton);
    }

    const rotationZPrimeButtonId = `${this.containerId}-rotation-zprime-button`;
    let rotationZPrimeButton = document.getElementById(
      rotationZPrimeButtonId
    ) as HTMLButtonElement;
    if (!rotationZPrimeButton) {
      rotationZPrimeButton = document.createElement("button");
      rotationZPrimeButton.id = rotationZPrimeButtonId;
      rotationZPrimeButton.textContent = "z'";
      rotationZPrimeButton.classList.add("rotation-button", "button");
      rotationZPrimeButton.addEventListener("click", () =>
        this.toggleSecretRotation("z'")
      );
      rotationButtonContainer.appendChild(rotationZPrimeButton);
    }

    const inputWrapperID = `${this.containerId}-input-wrapper`;
    let inputWrapper = document.getElementById(inputWrapperID);
    if (!inputWrapper) {
      inputWrapper = document.createElement("div");
      inputWrapper.id = inputWrapperID;
      inputWrapper.style.display = "flex";
      inputWrapper.style.flexDirection = "row";
      inputWrapper.style.alignItems = "flex-start";
      inputWrapper.style.width = "100%";
      columnWrapper.appendChild(inputWrapper);
    }

    const moveInputId = `${this.containerId}-move-input`;
    let moveInput = document.getElementById(moveInputId) as HTMLTextAreaElement;
    if (!moveInput) {
      moveInput = document.createElement("textarea");
      moveInput.id = moveInputId;
      moveInput.classList.add("move-input");
      moveInput.style.flexGrow = "1";
      inputWrapper.appendChild(moveInput);
    }

    if (state && state.textboxDimensions) {
      moveInput.style.width = `${state.textboxDimensions.width}px`;
      moveInput.style.height = `${state.textboxDimensions.height}px`;
    }

    moveInput.addEventListener("mouseup", () => this.saveState());
    moveInput.addEventListener("touchend", () => this.saveState());

    const duplicateButtonId = `${this.containerId}-duplicate-button`;
    let duplicateButton = document.getElementById(duplicateButtonId);
    if (!duplicateButton) {
      duplicateButton = document.createElement("button");
      duplicateButton.id = duplicateButtonId;
      duplicateButton.textContent = "+";
      duplicateButton.classList.add("duplicate-button");
      duplicateButton.title = "Duplicate this cube view";

      duplicateButton.addEventListener("click", () => this.duplicateCubeView());
      inputWrapper.appendChild(duplicateButton);
    }

    const finishButtonId = `${this.containerId}-finish-button`;
    let finishButton = document.getElementById(finishButtonId);
    if (!finishButton) {
      finishButton = document.createElement("button");
      finishButton.id = finishButtonId;
      finishButton.textContent = "✔";
      finishButton.classList.add("finish-button");
      finishButton.title = "Finish this cube view";

      finishButton.addEventListener("click", () => this.finishCubeView());
      inputWrapper.appendChild(finishButton);
    }

    const ratingWrapperId = `${this.containerId}-rating-wrapper`;
    let ratingWrapper = document.getElementById(ratingWrapperId);
    if (!ratingWrapper) {
      ratingWrapper = document.createElement("div");
      ratingWrapper.id = ratingWrapperId;
      ratingWrapper.classList.add("rating-wrapper");
      ratingWrapper.style.display = "flex";
      ratingWrapper.style.justifyContent = "center";
      ratingWrapper.style.marginTop = "10px";
      columnWrapper.appendChild(ratingWrapper);

      const thumbsUpButton = document.createElement("button");
      thumbsUpButton.innerHTML = "👍";
      thumbsUpButton.classList.add("rating-button", "thumbs-up");
      thumbsUpButton.style.marginRight = "10px";
      thumbsUpButton.addEventListener("click", () => this.markAsGood());
      ratingWrapper.appendChild(thumbsUpButton);

      const thumbsDownButton = document.createElement("button");
      thumbsDownButton.innerHTML = "👎";
      thumbsDownButton.classList.add("rating-button", "thumbs-down");
      thumbsDownButton.addEventListener("click", () => this.markAsBad());
      ratingWrapper.appendChild(thumbsDownButton);
    }

    const eoSwitchId = `${this.containerId}-eo-switch`;
    let eoSwitch = document.getElementById(eoSwitchId) as HTMLLabelElement;
    if (!eoSwitch) {
      const eoSwitchWrapper = document.createElement("div");
      eoSwitchWrapper.style.display = "flex";
      eoSwitchWrapper.style.alignItems = "center";
      eoSwitchWrapper.style.marginRight = "8px";
      eoSwitchWrapper.style.height = "32px";

      const eoSwitchLabel = document.createElement("span");
      eoSwitchLabel.textContent = "EO";
      eoSwitchLabel.className = "eo-switch-label";
      eoSwitchLabel.style.marginRight = "6px";
      eoSwitchLabel.style.fontWeight = "bold";
      eoSwitchLabel.style.fontSize = "1rem";
      eoSwitchWrapper.appendChild(eoSwitchLabel);

      eoSwitch = document.createElement("label");
      eoSwitch.id = eoSwitchId;
      eoSwitch.className = "eo-switch-outer";
      eoSwitch.innerHTML = `
        <input type="checkbox" class="eo-switch-checkbox" style="display:none;" ${this.isEOView ? "checked" : ""}>
        <span class="eo-switch-slider"></span>
      `;
      eoSwitch.title = "Toggle EO View";
      eoSwitch.querySelector("input")!.addEventListener("change", () => this.toggleEOView());
      eoSwitchWrapper.appendChild(eoSwitch);

      inputWrapper.insertBefore(eoSwitchWrapper, inputWrapper.firstChild);
    } else {
      (eoSwitch.querySelector("input") as HTMLInputElement).checked = this.isEOView;
    }

    const eoListWrapperId = `${this.containerId}-eo-list-wrapper`;
    let eoListWrapper = document.getElementById(eoListWrapperId) as HTMLDivElement;
    if (!eoListWrapper) {
      eoListWrapper = document.createElement("div");
      eoListWrapper.id = eoListWrapperId;
      eoListWrapper.className = "eo-list-wrapper";
      eoListWrapper.style.display = "none";
      inputWrapper.insertBefore(eoListWrapper, duplicateButton);
    }

    if (state && state.textboxDimensions) {
      eoListWrapper.style.width = `${state.textboxDimensions.width}px`;
      eoListWrapper.style.height = `${state.textboxDimensions.height}px`;
    }

    eoListWrapper.addEventListener("mouseup", () => this.saveEOListDimensions());
    eoListWrapper.addEventListener("touchend", () => this.saveEOListDimensions());

    cubeContainer.insertBefore(this.twistyPlayer, columnWrapper);

    const splitScramble = this.scramble.split(" ");
    splitScramble.forEach((move) => {
      this.twistyPlayer.experimentalAddMove(move);
    });

    this.initializeMoveInput();

    if (this.previousMoves) {
      const moveInput = document.getElementById(
        `${this.containerId}-move-input`
      ) as HTMLTextAreaElement;
      if (moveInput) {
        moveInput.value = this.previousMoves;
      }
      this.applyMoves(this.previousMoves, true);
    }

    this.updateMinimizedState();

    this.updateViewStatus();

    this.renderEOList();

    this.updateEOViewUI();

    cubeContainer.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      if (
        target.tagName === "BUTTON" ||
        target.tagName === "TEXTAREA" ||
        target.id === `${this.containerId}-drag-icon` ||
        target.closest(".twisty-player-component") ||
        target.classList.contains("rating-button") ||
        target.classList.contains("text-preview")
      ) {
        return;
      }

      const moveInput = document.getElementById(
        `${this.containerId}-move-input`
      ) as HTMLTextAreaElement;

      if (moveInput && !this.isMinimized) {
        moveInput.focus();

        if (document.activeElement === moveInput) {
          const currentStart = moveInput.selectionStart;
          const currentEnd = moveInput.selectionEnd;
          setTimeout(() => {
            moveInput.selectionStart = currentStart;
            moveInput.selectionEnd = currentEnd;
          }, 0);
        }
      }
    });
  }

  private markAsGood() {
    if (this.isGood === true) {
      this.isGood = null;
    } else {
      this.isGood = true;
    }
    this.updateViewStatus();
    this.saveState();
  }

  private markAsBad() {
    if (this.isGood === false) {
      this.isGood = null;
    } else {
      this.isGood = false;
    }
    this.updateViewStatus();
    this.saveState();
  }

  private updateViewStatus() {
    const cubeContainer = document.getElementById(this.containerId);
    const thumbsUpButton = document.querySelector(
      `#${this.containerId}-rating-wrapper .thumbs-up`
    );
    const thumbsDownButton = document.querySelector(
      `#${this.containerId}-rating-wrapper .thumbs-down`
    );

    if (!cubeContainer || !thumbsUpButton || !thumbsDownButton) return;

    thumbsUpButton.classList.remove("active");
    thumbsDownButton.classList.remove("active");

    if (this.isGood === true) {
      cubeContainer.style.backgroundColor = "lightgreen";
      thumbsUpButton.classList.add("active");
    } else if (this.isGood === false) {
      cubeContainer.style.backgroundColor = "lightcoral";
      thumbsDownButton.classList.add("active");
    } else {
      cubeContainer.style.backgroundColor = "";
    }
  }

  public saveState() {
    const cubeContainer = document.getElementById(this.containerId);
    if (!cubeContainer) return;

    const moveInput = document.getElementById(
      `${this.containerId}-move-input`
    ) as HTMLTextAreaElement;
    const eoListWrapper = document.getElementById(
      `${this.containerId}-eo-list-wrapper`
    ) as HTMLDivElement;

    const rect = cubeContainer.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY =
      window.pageYOffset || document.documentElement.scrollTop;

    let textboxDimensions;
    if (this.isEOView && eoListWrapper) {
      textboxDimensions = {
        width: eoListWrapper.offsetWidth,
        height: eoListWrapper.offsetHeight,
      };
    } else if (moveInput) {
      textboxDimensions = {
        width: moveInput.offsetWidth,
        height: moveInput.offsetHeight,
      };
    }

    const state: CubeViewState = {
      id: this.containerId,
      moves: moveInput ? moveInput.value : this.previousMoves,
      position: {
        left: rect.left + scrollX,
        top: rect.top + scrollY,
      },
      isMinimized: this.isMinimized,
      isNormal: this.isNormal,
      secretRotation: this.secretRotation,
      isGood: this.isGood,
      textboxDimensions,
      isEOView: this.isEOView,
      eoList: this.eoList,
      selectedEOIndex: this.selectedEOIndex,
    };

    saveState(`cubeView_${this.containerId}`, state);

    this.saveAppState();
  }

  private loadState(): CubeViewState | null {
    const state = loadState<CubeViewState | null>(
      `cubeView_${this.containerId}`,
      null
    );
    if (state) {
      this.isGood = state.isGood !== undefined ? state.isGood : null;
      this.updateViewStatus();
      this.isEOView = !!state.isEOView;
      this.eoList = state.eoList || [];
      this.selectedEOIndex = state.selectedEOIndex ?? 0;

      if (state.textboxDimensions) {
        const moveInput = document.getElementById(
          `${this.containerId}-move-input`
        ) as HTMLTextAreaElement;
        if (moveInput) {
          moveInput.style.width = `${state.textboxDimensions.width}px`;
          moveInput.style.height = `${state.textboxDimensions.height}px`;
        }
      }
    }
    return state;
  }

  private saveAppState() {
    const containers = document.querySelectorAll(".cube-container");
    const cubeViewIds: string[] = [];

    containers.forEach((container) => {
      cubeViewIds.push(container.id);
    });

    const connections: { sourceId: string; targetId: string }[] = loadState<
      { sourceId: string; targetId: string }[]
    >("cubeViewConnections", []);

    const filteredConnections = connections.filter(
      (conn) => conn.sourceId !== this.containerId
    );

    this.sourceConnections.forEach((connection) => {
      filteredConnections.push({
        sourceId: connection.getSourceId(),
        targetId: connection.getTargetId(),
      });
    });

    saveState("cubeViewConnections", filteredConnections);
    saveState("cubeViewIds", cubeViewIds);
    saveState("cubeViewCount", cubeViewIds.length);
  }

  public restoreConnections() {
    const connections = loadState<{ sourceId: string; targetId: string }[]>(
      "cubeViewConnections",
      []
    );

    connections.forEach(({ sourceId, targetId }) => {
      if (sourceId === this.containerId) {
        const targetContainer = document.getElementById(targetId);
        if (targetContainer) {
          const connection = new Connection(sourceId, targetId);
          this.sourceConnections.push(connection);

          const targetMoveInput = document.getElementById(
            `${targetId}-move-input`
          );
          if (targetMoveInput) {
            const event = new CustomEvent("addTargetConnection", {
              detail: { connection: connection },
            });
            targetMoveInput.dispatchEvent(event);
          }
        } else {
          console.warn(
            `Target container ${targetId} not found for connection from ${sourceId}`
          );
        }
      }
    });

    this.updateConnections();
  }

  private toggleMode(button: HTMLButtonElement) {
    this.isNormal = !this.isNormal;
    button.textContent = this.isNormal ? "Normal" : "Inverse";
    button.style.backgroundColor = this.isNormal ? BLUE : ORANGE;
    this.applyMoves(this.previousMoves.trim(), true);
    this.saveState();
  }

  private toggleMinimized() {
    this.isMinimized = !this.isMinimized;
    this.updateMinimizedState();
    this.saveState();
  }

  private updateMinimizedState() {
    const cubeContainer = document.getElementById(this.containerId);
    const minimizeButton = document.getElementById(
      `${this.containerId}-minimize-button`
    );
    const moveInput = document.getElementById(
      `${this.containerId}-move-input`
    ) as HTMLTextAreaElement;
    const dragIcon = document.getElementById(`${this.containerId}-drag-icon`);

    if (!cubeContainer || !minimizeButton) return;

    if (this.isMinimized) {
      minimizeButton.innerHTML = "+";
      minimizeButton.classList.add("maximize-button");
      minimizeButton.classList.remove("minimize-button");

      if (dragIcon) {
        dragIcon.style.display = "none";
      }

      let textPreview = document.getElementById(
        `${this.containerId}-text-preview`
      );
      if (!textPreview) {
        textPreview = document.createElement("div");
        textPreview.id = `${this.containerId}-text-preview`;
        textPreview.classList.add("text-preview");
        textPreview.addEventListener("click", () => {
          this.toggleMinimized();
        });
        cubeContainer.appendChild(textPreview);
      } else {
        textPreview.style.display = "block";
      }

      let previewText = "(Empty)";
      if (moveInput && moveInput.value) {
        const text = moveInput.value;
        const firstLine = text.split("\n")[0] || "";
        previewText =
          firstLine.length > 30
            ? firstLine.substring(0, 27) + "..."
            : firstLine;
      } else if (this.previousMoves) {
        const firstLine = this.previousMoves.split("\n")[0] || "";
        previewText =
          firstLine.length > 30
            ? firstLine.substring(0, 27) + "..."
            : firstLine;
      }

      textPreview.textContent = previewText || "(Empty)";

      Array.from(cubeContainer.children).forEach((child) => {
        if (
          child.id !== `${this.containerId}-minimize-button` &&
          child.id !== `${this.containerId}-text-preview` &&
          child.id !== `${this.containerId}-drag-icon`
        ) {
          (child as HTMLElement).style.display = "none";
        }
      });

      cubeContainer.classList.add("cube-container-minimized");

      this.makeContainerDraggable(cubeContainer);
    } else {
      minimizeButton.innerHTML = "−";
      minimizeButton.classList.add("minimize-button");
      minimizeButton.classList.remove("maximize-button");

      if (dragIcon) {
        dragIcon.style.display = "";
      }

      const textPreview = document.getElementById(
        `${this.containerId}-text-preview`
      );
      if (textPreview) {
        textPreview.style.display = "none";
      }

      Array.from(cubeContainer.children).forEach((child) => {
        if (child.id !== `${this.containerId}-text-preview`) {
          (child as HTMLElement).style.display = "";
        }
      });

      cubeContainer.classList.remove("cube-container-minimized");

      this.removeContainerDragHandlers(cubeContainer);
    }
  }

  private makeContainerDraggable(container: HTMLElement) {
    const mouseDownHandler = (event: MouseEvent) => {
      if (
        (event.target as HTMLElement).id !==
          `${this.containerId}-minimize-button` &&
        this.isMinimized
      ) {
        container.classList.add("grabbing");
        container.style.zIndex = "100";

        const rect = container.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const offsetY = event.clientY - rect.top;

        const mouseMoveHandler = (moveEvent: MouseEvent) => {
          const scrollX =
            window.pageXOffset || document.documentElement.scrollLeft;
          const scrollY =
            window.pageYOffset || document.documentElement.scrollTop;

          const newLeft = moveEvent.clientX + scrollX - offsetX;
          const newTop = moveEvent.clientY + scrollY - offsetY;

          container.style.left = `${newLeft}px`;
          container.style.top = `${newTop}px`;

          this.checkAndScroll(moveEvent.clientX, moveEvent.clientY);
          this.updateConnections();
          Connection.updateConnectionsIntersectingCubeView(this.containerId);
          this.ensureDocumentSize();

          moveEvent.preventDefault();
        };

        const mouseUpHandler = () => {
          container.classList.remove("grabbing");
          document.removeEventListener("mousemove", mouseMoveHandler);
          document.removeEventListener("mouseup", mouseUpHandler);

          this.updateConnections();
          Connection.updateConnectionsIntersectingCubeView(this.containerId);
          this.ensureDocumentSize();
        };

        document.addEventListener("mousemove", mouseMoveHandler);
        document.addEventListener("mouseup", mouseUpHandler);

        event.preventDefault();
      }
    };

    const touchStartHandler = (event: TouchEvent) => {
      if (
        (event.target as HTMLElement).id !==
        `${this.containerId}-minimize-button`
      ) {
        container.classList.add("grabbing");
        container.style.zIndex = "100";

        const touch = event.touches[0];
        const rect = container.getBoundingClientRect();
        const offsetX = touch.clientX - rect.left;
        const offsetY = touch.clientY - rect.top;

        const touchMoveHandler = (moveEvent: TouchEvent) => {
          const touch = moveEvent.touches[0];
          const scrollX =
            window.pageXOffset || document.documentElement.scrollLeft;
          const scrollY =
            window.pageYOffset || document.documentElement.scrollTop;

          const newLeft = touch.clientX + scrollX - offsetX;
          const newTop = touch.clientY + scrollY - offsetY;

          container.style.left = `${newLeft}px`;
          container.style.top = `${newTop}px`;

          this.checkAndScroll(touch.clientX, touch.clientY);
          this.updateConnections();
          Connection.updateConnectionsIntersectingCubeView(this.containerId);
          this.ensureDocumentSize();

          moveEvent.preventDefault();
        };

        const touchEndHandler = () => {
          container.classList.remove("grabbing");
          document.removeEventListener("touchmove", touchMoveHandler);
          document.removeEventListener("touchend", touchEndHandler);

          this.updateConnections();
          Connection.updateConnectionsIntersectingCubeView(this.containerId);
          this.ensureDocumentSize();
        };

        document.addEventListener("touchmove", touchMoveHandler);
        document.addEventListener("touchend", touchEndHandler);

        event.preventDefault();
      }
    };

    container.addEventListener("mousedown", mouseDownHandler);
    container.addEventListener("touchstart", touchStartHandler);
    container.style.cursor = "grab";
  }

  private removeContainerDragHandlers(container: HTMLElement) {
    container.style.cursor = "";
  }

  private initializeMoveInput() {
    const moveInputId = `${this.containerId}-move-input`;
    let moveInput = document.getElementById(moveInputId) as HTMLTextAreaElement;
    if (!moveInput) {
      moveInput = document.createElement("textarea");
      moveInput.id = moveInputId;
      moveInput.classList.add("move-input");
      const cubeContainer = document.getElementById(this.containerId);
      if (cubeContainer) {
        cubeContainer.appendChild(moveInput);
      }
    }

    let previousValue = moveInput.value;

    moveInput.addEventListener("input", (event) => {
      const input = event.target as HTMLTextAreaElement;
      const cursorPosition = input.selectionStart;
      const currentValue = input.value;

      if (
        cursorPosition > 0 &&
        currentValue.length > previousValue.length &&
        currentValue[cursorPosition - 1] === "("
      ) {
        input.value =
          currentValue.slice(0, cursorPosition) +
          ")" +
          currentValue.slice(cursorPosition);

        input.selectionStart = input.selectionEnd = cursorPosition;
      }

      if (
        cursorPosition > 0 &&
        currentValue.length > previousValue.length &&
        currentValue[cursorPosition - 1] === ")" &&
        cursorPosition < currentValue.length &&
        currentValue[cursorPosition] === ")"
      ) {
        input.value =
          currentValue.slice(0, cursorPosition) +
          currentValue.slice(cursorPosition + 1);
        input.selectionStart = input.selectionEnd = cursorPosition;
      }

      previousValue = input.value;
      this.saveState();

      if (this.isMinimized) {
        const textPreview = document.getElementById(
          `${this.containerId}-text-preview`
        );
        if (textPreview) {
          const text = input.value || "";
          const firstLine = text.split("\n")[0] || "";
          const preview =
            firstLine.length > 30
              ? firstLine.substring(0, 27) + "..."
              : firstLine;
          textPreview.textContent = preview || "(Empty)";
        }
      }

      this.updateMoveCounter();

      const movesUpToCursor = input.value.substring(0, cursorPosition).trim();
      this.applyMoves(movesUpToCursor, false);
    });

    moveInput.addEventListener("click", (event) => {
      const input = event.target as HTMLTextAreaElement;
      const cursorPosition = input.selectionStart;
      const movesUpToCursor = input.value.substring(0, cursorPosition).trim();
      this.applyMoves(movesUpToCursor, false);
    });

    moveInput.addEventListener("keyup", (event) => {
      if (
        [
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "Home",
          "End",
        ].includes(event.key)
      ) {
        const input = event.target as HTMLTextAreaElement;
        const cursorPosition = input.selectionStart;
        const movesUpToCursor = input.value.substring(0, cursorPosition).trim();
        this.applyMoves(movesUpToCursor, false);
      }
    });

    moveInput.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "/") {
        event.preventDefault();

        const input = event.target as HTMLTextAreaElement;
        const value = input.value;
        const selectionStart = input.selectionStart;
        const selectionEnd = input.selectionEnd;

        const lines = value.split("\n");
        const startLine =
          value.substring(0, selectionStart).split("\n").length - 1;
        const endLine = value.substring(0, selectionEnd).split("\n").length - 1;

        const allLinesCommented = lines
          .slice(startLine, endLine + 1)
          .every((line) => line.trimStart().startsWith("//"));

        for (let i = startLine; i <= endLine; i++) {
          if (allLinesCommented) {
            if (lines[i].trimStart().startsWith("//")) {
              const trimStart = lines[i].length - lines[i].trimStart().length;
              lines[i] =
                lines[i].substring(0, trimStart) +
                lines[i].substring(trimStart + 2);
            }
          } else {
            lines[i] = "//" + lines[i];
          }
        }

        const newValue = lines.join("\n");
        input.value = newValue;

        input.setSelectionRange(
          selectionStart,
          selectionEnd +
            (allLinesCommented ? -2 : 2) * (endLine - startLine + 1)
        );

        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    moveInput.addEventListener("addTargetConnection", (event: CustomEvent) => {
      const connection = event.detail.connection;
      if (connection) {
        this.addTargetConnection(connection);
      }
    });
  }

  private separateMoves(moves: string) {
    this.normalMoves = "";
    this.inverseMoves = "";

    let isInGroup = false;
    let groupBuffer = "";

    if (moves.trim() == "") {
      if (this.isNormal) {
        this.twistyPlayer.alg = this.scramble;
      } else {
        this.twistyPlayer.alg = this.invertMoves(this.scramble);
      }
      return;
    }

    const moveList = moves.split(" ");
    moveList.forEach((move) => {
      let processedMove = move;
      if (move.endsWith("2") && move.length > 1) {
        const baseMove = move.slice(0, -1);
        if (validMoveRegex.test(baseMove)) {
          processedMove = `${baseMove} ${baseMove}`;
        }
      }
      const movesToAdd = processedMove.split(" ");
      movesToAdd.forEach((singleMove) => {
        if (singleMove.startsWith("(") && singleMove.endsWith(")")) {
          this.inverseMoves +=
            (this.inverseMoves ? " " : "") + singleMove.slice(1, -1);
        } else if (singleMove.startsWith("(")) {
          isInGroup = true;
          groupBuffer = singleMove.slice(1);
        } else if (singleMove.endsWith(")") && isInGroup) {
          groupBuffer += " " + singleMove.slice(0, -1);
          this.inverseMoves +=
            (this.inverseMoves ? " " : "") + groupBuffer.trim();
          groupBuffer = "";
          isInGroup = false;
        } else if (isInGroup) {
          groupBuffer += " " + singleMove;
        } else {
          if (validMoveRegex.test(singleMove)) {
            this.normalMoves += (this.normalMoves ? " " : "") + singleMove;
          }
        }
      });
    });
    if (isInGroup && groupBuffer) {
      this.inverseMoves += (this.inverseMoves ? " " : "") + groupBuffer.trim();
    }
  }

  public invertMoves(moves: string): string {
    let inverseMoves = "";
    const moveList = moves.split(" ");
    moveList.forEach((move) => {
      if (move.endsWith("'")) {
        inverseMoves += move.slice(0, -1) + " ";
      } else if (move.endsWith("2")) {
        inverseMoves += move + " ";
      } else {
        inverseMoves += move + "' ";
      }
    });
    return inverseMoves.trim().split(" ").reverse().join(" ");
  }

  private removeComments(moves): string {
    return moves
      .split("\n")
      .map((line) => line.split("//")[0].trim())
      .filter((line) => line.length > 0)
      .join(" ");
  }

  private fixApostrophe(moves: string): string {
    return moves.replaceAll("‘", "'");
  }

  public updateScramble(scramble) {
    this.scramble = scramble;
    this.applyMoves(this.previousMoves, true);
  }

  private applyMoves(moves: string, fromInverseButton: boolean) {
    moves = this.removeComments(moves);
    moves = this.fixApostrophe(moves);
    if (moves.trim() == "") {
      this.previousMoves = moves;
      if (this.isNormal) {
        this.twistyPlayer.alg = this.scramble;
      } else {
        this.twistyPlayer.alg = this.invertMoves(this.scramble);
      }

      if (this.secretRotation) {
        this.twistyPlayer.experimentalAddMove(this.secretRotation);
      }

      const moveCounter = document.getElementById(
        `${this.containerId}-move-counter`
      ) as HTMLDivElement;
      if (moveCounter) {
        moveCounter.textContent = "Moves: 0";
      }
      return;
    }
    if (fromInverseButton || moves !== this.previousMoves) {
      if (this.isNormal) {
        this.previousMoves = moves;
        this.twistyPlayer.alg = "";
        this.separateMoves(moves);

        if (this.inverseMoves) {
          let invertedMoves = this.invertMoves(this.inverseMoves).split(" ");
          invertedMoves.forEach((move) => {
            if (validMoveRegex.test(move)) {
              this.twistyPlayer.experimentalAddMove(move);
            }
          });
        }

        if (this.scramble) {
          const scrambleMoves = this.scramble.split(" ");
          scrambleMoves.forEach((move) => {
            if (validMoveRegex.test(move)) {
              this.twistyPlayer.experimentalAddMove(move);
            }
          });
        }

        if (this.normalMoves) {
          const userMoves = this.normalMoves.split(" ");
          userMoves.forEach((move) => {
            if (validMoveRegex.test(move)) {
              this.twistyPlayer.experimentalAddMove(move);
            } else {
              this.showToast(`Invalid move: ${move}`);
            }
          });
        }

        if (this.secretRotation) {
          this.twistyPlayer.experimentalAddMove(this.secretRotation);
        }
      } else {
        this.previousMoves = moves;
        this.twistyPlayer.alg = "";
        this.separateMoves(moves);

        if (this.normalMoves) {
          let invertedMoves = this.invertMoves(this.normalMoves).split(" ");
          invertedMoves.forEach((move) => {
            if (validMoveRegex.test(move)) {
              this.twistyPlayer.experimentalAddMove(move);
            }
          });
        }

        if (this.scramble) {
          const scrambleMoves = this.invertMoves(this.scramble).split(" ");
          scrambleMoves.forEach((move) => {
            if (validMoveRegex.test(move)) {
              this.twistyPlayer.experimentalAddMove(move);
            }
          });
        }

        if (this.inverseMoves) {
          const userMoves = this.inverseMoves.split(" ");
          userMoves.forEach((move) => {
            if (validMoveRegex.test(move)) {
              this.twistyPlayer.experimentalAddMove(move);
            } else {
              this.showToast(`Invalid move: ${move}`);
            }
          });
        }

        if (this.secretRotation) {
          this.twistyPlayer.experimentalAddMove(this.secretRotation);
        }
      }

      if (fromInverseButton) {
        this.updateMoveCounter();
      }
    }
  }

  private updateMoveCounter() {
    const moveCounter = document.getElementById(
      `${this.containerId}-move-counter`
    ) as HTMLDivElement;
    const moveInput = document.getElementById(
      `${this.containerId}-move-input`
    ) as HTMLTextAreaElement;

    if (!moveCounter || !moveInput) return;

    const fullText = moveInput.value.trim();
    if (!fullText) {
      moveCounter.textContent = "Moves: 0";
      return;
    }

    const cleanedText = this.removeComments(fullText);
    const moveCount = this.countAllMoves(cleanedText);
    moveCounter.textContent = `Moves: ${moveCount}`;
  }

  private countAllMoves(movesText: string): number {
    if (!movesText.trim()) return 0;

    movesText = this.fixApostrophe(movesText);

    let totalCount = 0;
    let isInParentheses = false;
    const moveTokens = movesText.split(/\s+/);

    for (let i = 0; i < moveTokens.length; i++) {
      let token = moveTokens[i];

      if (!token) continue;

      if (token.includes("(") && !token.includes(")")) {
        isInParentheses = true;
        token = token.replace("(", "");
      }

      if (token.includes(")") && !token.includes("(")) {
        isInParentheses = false;
        token = token.replace(")", "");
      }

      if (token.startsWith("(") && token.endsWith(")")) {
        token = token.slice(1, -1);
      }

      if (countableMoveRegex.test(token)) {
        totalCount++;
      } else if (
        token.endsWith("2") &&
        countableMoveRegex.test(token.slice(0, -1))
      ) {
        totalCount++;
      } else if (
        i + 1 < moveTokens.length &&
        token === moveTokens[i + 1] &&
        countableMoveRegex.test(token)
      ) {
        totalCount++;
        i++;
      }
    }

    return totalCount;
  }

  private showToast(message: string) {
    const toastId = `${this.containerId}-toast`;
    let toast = document.getElementById(toastId);
    if (!toast) {
      toast = document.createElement("div");
      toast.id = toastId;
      toast.classList.add("toast");
      const cubeContainer = document.getElementById(this.containerId);
      if (cubeContainer) {
        cubeContainer.appendChild(toast);
      }
    }
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  private toggleSecretRotation(rotation: string) {
    if (this.secretRotation === rotation) {
      this.secretRotation = "";
    } else {
      this.secretRotation = rotation;
    }

    const rotationXButton = document.getElementById(
      `${this.containerId}-rotation-x-button`
    );
    const rotationXPrimeButton = document.getElementById(
      `${this.containerId}-rotation-xprime-button`
    );
    const rotationZButton = document.getElementById(
      `${this.containerId}-rotation-z-button`
    );
    const rotationZPrimeButton = document.getElementById(
      `${this.containerId}-rotation-zprime-button`
    );

    [
      rotationXButton,
      rotationXPrimeButton,
      rotationZButton,
      rotationZPrimeButton,
    ].forEach((button) => {
      if (button) {
        button.style.backgroundColor = "";
        button.style.color = BLUE;
      }
    });

    if (this.secretRotation) {
      const activeButton = {
        x: rotationXButton,
        "x'": rotationXPrimeButton,
        z: rotationZButton,
        "z'": rotationZPrimeButton,
      }[this.secretRotation];

      if (activeButton) {
        activeButton.style.backgroundColor = BLUE;
        activeButton.style.color = "white";
      }
    }

    this.applyMoves(this.previousMoves, true);
    this.saveState();
  }

  private duplicateCubeView() {
    if (this.isEOView) {
      const eo = this.eoList[this.selectedEOIndex] || "";
      const newContainerId = `cube-container-${Date.now()}`;
      const newCubeView = new CubeView(this.scramble, newContainerId);
      newCubeView.initialize();
      const newMoveInput = document.getElementById(
        `${newContainerId}-move-input`
      ) as HTMLTextAreaElement;
      if (newMoveInput) {
        newMoveInput.value = eo;
        newCubeView.applyMoves(eo, true);
      }
      const originalContainer = document.getElementById(this.containerId);
      const newContainer = document.getElementById(newContainerId);
      if (originalContainer && newContainer) {
        const position = this.findNonOverlappingPosition(originalContainer);
        newContainer.style.position = "absolute";
        newContainer.style.top = `${position.top}px`;
        newContainer.style.left = `${position.left}px`;
        this.createConnectionLine(originalContainer, newContainer);
        this.ensureDocumentSize();
      }
      newCubeView.saveState();
      this.saveState();
      return;
    }
    const moveInput = document.getElementById(
      `${this.containerId}-move-input`
    ) as HTMLTextAreaElement;
    if (!moveInput) return;

    const currentContent = moveInput.value;
    const selectionStart = moveInput.selectionStart;
    const selectionEnd = moveInput.selectionEnd;
    const hasSelection = selectionStart !== selectionEnd;

    let contentToCopy = currentContent;
    let cursorPosition = selectionStart;

    if (hasSelection) {
      contentToCopy = currentContent.substring(selectionStart, selectionEnd);
      cursorPosition = 0;
    }

    const newContainerId = `cube-container-${Date.now()}`;
    const newCubeView = new CubeView(this.scramble, newContainerId);
    newCubeView.initialize();

    const originalContainer = document.getElementById(this.containerId);
    const newContainer = document.getElementById(newContainerId);

    if (originalContainer && newContainer) {
      const newMoveInput = document.getElementById(
        `${newContainerId}-move-input`
      ) as HTMLTextAreaElement;
      if (newMoveInput) {
        newMoveInput.value = contentToCopy;
        this.applyMovesToNewCubeView(
          newCubeView,
          contentToCopy,
          cursorPosition
        );
      }

      const position = this.findNonOverlappingPosition(originalContainer);
      newContainer.style.position = "absolute";
      newContainer.style.top = `${position.top}px`;
      newContainer.style.left = `${position.left}px`;

      this.createConnectionLine(originalContainer, newContainer);
      this.ensureDocumentSize();
    }

    if (newCubeView) {
      newCubeView.saveState();
    }
    this.saveState();
  }

  private simplifyConsecutiveMoves(moves: string): string {
    const moveList = moves.split(" ");
    const simplifiedMoves: string[] = [];

    for (let i = 0; i < moveList.length; i++) {
      const currentMove = moveList[i];
      const nextMove = moveList[i + 1];

      if (!currentMove) continue;

      if (currentMove === nextMove) {
        if (currentMove.endsWith("2")) {
          i++;
        } else if (currentMove.endsWith("'")) {
          simplifiedMoves.push(currentMove.replace("'", "2"));
          i++;
        } else {
          simplifiedMoves.push(`${currentMove}2`);
          i++;
        }
      } else {
        simplifiedMoves.push(currentMove);
      }
    }

    return simplifiedMoves.join(" ");
  }

  private finishCubeView() {
    const simplifiedNormalMoves = this.simplifyConsecutiveMoves(
      this.normalMoves
    );
    const simplifiedInverseMoves = this.simplifyConsecutiveMoves(
      this.inverseMoves
    );
    const finishedMoves = `${simplifiedNormalMoves} ${this.invertMoves(
      simplifiedInverseMoves
    )}`.trim();

    const newContainerId = `cube-container-${Date.now()}`;
    const newCubeView = new CubeView(this.scramble, newContainerId);
    newCubeView.initialize();

    const originalContainer = document.getElementById(this.containerId);
    const newContainer = document.getElementById(newContainerId);

    if (originalContainer && newContainer) {
      const newMoveInput = document.getElementById(
        `${newContainerId}-move-input`
      ) as HTMLTextAreaElement;
      if (newMoveInput) {
        newMoveInput.value = finishedMoves;

        newCubeView.applyMoves(finishedMoves, true);

        newCubeView.updateMoveCounter();
      }

      const position = this.findNonOverlappingPosition(originalContainer);
      newContainer.style.position = "absolute";
      newContainer.style.top = `${position.top}px`;
      newContainer.style.left = `${position.left}px`;

      this.createConnectionLine(originalContainer, newContainer);
      this.ensureDocumentSize();
    }

    if (newCubeView) {
      newCubeView.saveState();
    }
    this.saveState();
  }

  private applyMovesToNewCubeView(
    cubeView: CubeView,
    content: string,
    cursorPosition: number
  ) {
    const moveInput = document.getElementById(
      `${cubeView.getContainerId()}-move-input`
    ) as HTMLTextAreaElement;
    if (moveInput) {
      moveInput.selectionStart = moveInput.selectionEnd = cursorPosition;

      const inputEvent = new Event("input", { bubbles: true });
      moveInput.dispatchEvent(inputEvent);

      const clickEvent = new MouseEvent("click", { bubbles: true });
      moveInput.dispatchEvent(clickEvent);
    }
  }

  private createConnectionLine(
    fromContainer: HTMLElement,
    toContainer: HTMLElement
  ) {
    const connection = new Connection(fromContainer.id, toContainer.id);

    this.sourceConnections.push(connection);

    const targetCubeViewElements = document.querySelectorAll(".cube-container");
    for (let i = 0; i < targetCubeViewElements.length; i++) {
      const element = targetCubeViewElements[i] as HTMLElement;
      if (element.id === toContainer.id) {
        const targetId = element.id;
        const moveInput = document.getElementById(`${targetId}-move-input`);
        if (moveInput) {
          const event = new CustomEvent("addTargetConnection", {
            detail: { connection: connection },
          });
          moveInput.dispatchEvent(event);
        }
        break;
      }
    }
  }

  public addTargetConnection(connection: Connection) {
    this.targetConnections.push(connection);
  }

  public createConnectionFromState(targetId: string) {
    const fromContainer = document.getElementById(this.containerId);
    const toContainer = document.getElementById(targetId);

    if (fromContainer && toContainer) {
      const exists = this.sourceConnections.some(
        (conn) =>
          conn.getSourceId() === this.containerId &&
          conn.getTargetId() === targetId
      );

      if (!exists) {
        const connection = new Connection(this.containerId, targetId);
        connection.setVisible(true);
        this.sourceConnections.push(connection);

        const targetMoveInput = document.getElementById(
          `${targetId}-move-input`
        );
        if (targetMoveInput) {
          const event = new CustomEvent("addTargetConnection", {
            detail: { connection: connection },
          });
          targetMoveInput.dispatchEvent(event);
        }

        connection.updatePosition();
        this.saveAppState();
      } else {
      }
    } else {
      console.warn(
        `Cannot create connection: containers not found (${this.containerId} -> ${targetId})`
      );
    }
  }

  private updateConnections() {
    try {
      this.sourceConnections.forEach((connection) => {
        connection.updatePosition();
      });

      this.targetConnections.forEach((connection) => {
        connection.updatePosition();
      });
    } catch (e) {
      console.error("Error updating connections:", e);
    }

    this.saveAppState();
  }

  public forceUpdateConnections() {
    this.sourceConnections.forEach((connection) => {
      connection.updatePosition();
      connection.setVisible(true);
    });

    this.targetConnections.forEach((connection) => {
      connection.updatePosition();
      connection.setVisible(true);
    });

    this.saveAppState();
  }

  public initializeConnections() {
    const connections = loadState<{ sourceId: string; targetId: string }[]>(
      "cubeViewConnections",
      []
    );

    connections.forEach(({ sourceId, targetId }) => {
      if (sourceId === this.containerId) {
        const targetContainer = document.getElementById(targetId);
        if (targetContainer) {
          const exists = this.sourceConnections.some(
            (conn) =>
              conn.getSourceId() === sourceId && conn.getTargetId() === targetId
          );

          if (!exists) {
            const connection = new Connection(sourceId, targetId);
            this.sourceConnections.push(connection);

            const targetView = document.getElementById(targetId);
            if (targetView) {
              const targetMoveInput = document.getElementById(
                `${targetId}-move-input`
              );
              if (targetMoveInput) {
                const event = new CustomEvent("addTargetConnection", {
                  detail: { connection: connection },
                });
                targetMoveInput.dispatchEvent(event);
              }
            }
          }
        }
      }
    });

    this.forceUpdateConnections();
  }

  public getContainerId(): string {
    return this.containerId;
  }

  private confirmDelete() {
    if (confirm("Are you sure you want to delete this cube view?")) {
      this.deleteCubeView();
    }
  }

  private deleteCubeView() {
    const cubeContainer = document.getElementById(this.containerId);
    if (cubeContainer) {
      cubeContainer.remove();
    }

    this.sourceConnections.forEach((connection) => {
      connection.remove();
    });

    this.targetConnections.forEach((connection) => {
      connection.remove();
    });

    this.sourceConnections = [];
    this.targetConnections = [];

    localStorage.removeItem(`cubeView_${this.containerId}`);

    this.saveAppState();
  }

  private checkAndScroll(clientX: number, clientY: number) {
    const scrollSpeed = 15;
    const scrollBoundary = 50;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (clientX > viewportWidth - scrollBoundary) {
      window.scrollBy(scrollSpeed, 0);
    } else if (clientX < scrollBoundary) {
      window.scrollBy(-scrollSpeed, 0);
    }

    if (clientY > viewportHeight - scrollBoundary) {
      window.scrollBy(0, scrollSpeed);
    } else if (clientY < scrollBoundary) {
      window.scrollBy(0, -scrollSpeed);
    }
  }

  private ensureDocumentSize() {
    const containers = document.querySelectorAll(".cube-container");

    let maxRight = window.innerWidth;
    let maxBottom = window.innerHeight;

    containers.forEach((container) => {
      const el = container as HTMLElement;
      const rect = el.getBoundingClientRect();

      const right = rect.right + window.scrollX + 300;
      const bottom = rect.bottom + window.scrollY + 300;

      maxRight = Math.max(maxRight, right);
      maxBottom = Math.max(maxBottom, bottom);
    });

    document.documentElement.style.minWidth = `${maxRight}px`;
    document.documentElement.style.minHeight = `${maxBottom}px`;
    document.body.style.minWidth = `${maxRight}px`;
    document.body.style.minHeight = `${maxBottom}px`;
  }

  private snapshotConnections() {
    const connectionsBackup = loadState<
      { sourceId: string; targetId: string }[]
    >("cubeViewConnections", []);
    sessionStorage.setItem(
      "connectionsBackup",
      JSON.stringify(connectionsBackup)
    );
  }

  private findNonOverlappingPosition(originalContainer: HTMLElement) {
    const rect = originalContainer.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    const containerWidth = rect.width;
    const containerHeight = rect.height;

    const allContainers = Array.from(
      document.querySelectorAll(".cube-container")
    ) as HTMLElement[];

    const spacing = 20;
    const rightwardAttempts = 5;

    const minLeft = Math.max(0, scrollX);
    const minTop = Math.max(0, scrollY);

    for (let attempt = 1; attempt <= rightwardAttempts; attempt++) {
      const rightPosition = {
        left: Math.max(minLeft, rect.right + scrollX + spacing * attempt),
        top: Math.max(minTop, rect.top + scrollY),
      };

      if (
        !this.isOverlapping(
          rightPosition,
          containerWidth,
          containerHeight,
          allContainers,
          originalContainer
        )
      ) {
        return rightPosition;
      }
    }

    const directions = [
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 1, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: 1, dy: -1 },
    ];

    let maxAttempts = 20;
    let x = 0,
      y = 0;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      for (const direction of directions) {
        const stepsToTry = direction.dx > 0 ? 3 : 1;

        for (let step = 1; step <= stepsToTry; step++) {
          x += direction.dx;
          y += direction.dy;

          let potentialLeft =
            rect.left + scrollX + x * (containerWidth + spacing);
          let potentialTop =
            rect.top + scrollY + y * (containerHeight + spacing / 2);

          potentialLeft = Math.max(minLeft, potentialLeft);
          potentialTop = Math.max(minTop, potentialTop);

          const position = {
            left: potentialLeft,
            top: potentialTop,
          };

          if (
            !this.isOverlapping(
              position,
              containerWidth,
              containerHeight,
              allContainers,
              originalContainer
            )
          ) {
            return position;
          }
        }
      }
    }

    return {
      left: Math.max(minLeft, rect.right + scrollX + spacing * 2),
      top: Math.max(minTop, rect.bottom + scrollY + spacing),
    };
  }

  private isOverlapping(
    position: { left: number; top: number },
    width: number,
    height: number,
    containers: HTMLElement[],
    excludeContainer: HTMLElement
  ): boolean {
    const proposedRect = {
      left: position.left,
      right: position.left + width,
      top: position.top,
      bottom: position.top + height,
    };

    return containers.some((container) => {
      if (container === excludeContainer) return false;

      const rect = container.getBoundingClientRect();
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;

      const containerRect = {
        left: rect.left + scrollX,
        right: rect.right + scrollX,
        top: rect.top + scrollY,
        bottom: rect.bottom + scrollY,
      };

      return !(
        proposedRect.right < containerRect.left ||
        proposedRect.left > containerRect.right ||
        proposedRect.bottom < containerRect.top ||
        proposedRect.top > containerRect.bottom
      );
    });
  }

  public static markConnectionsLoaded() {
    CubeView.connectionsLoaded = true;
  }

  private toggleEOView() {
    this.isEOView = !this.isEOView;
    this.updateEOViewUI();
    this.saveState();
  }

  private updateEOViewUI() {
    const moveInput = document.getElementById(`${this.containerId}-move-input`);
    const eoListWrapper = document.getElementById(`${this.containerId}-eo-list-wrapper`);
    const eoSwitch = document.getElementById(`${this.containerId}-eo-switch`);
    const moveCounter = document.getElementById(`${this.containerId}-move-counter`);
    if (this.isEOView) {
      if (moveInput) moveInput.style.display = "none";
      if (eoListWrapper) eoListWrapper.style.display = "";
      if (eoSwitch) (eoSwitch.querySelector("input") as HTMLInputElement).checked = true;
      if (moveCounter) moveCounter.style.display = "none";
    } else {
      if (moveInput) moveInput.style.display = "";
      if (eoListWrapper) eoListWrapper.style.display = "none";
      if (eoSwitch) (eoSwitch.querySelector("input") as HTMLInputElement).checked = false;
      if (moveCounter) moveCounter.style.display = "";
    }
    this.renderEOList();
    if (this.isEOView && this.eoList.length > 0) {
      this.applyMoves(this.eoList[this.selectedEOIndex] || "", true);
    }
  }

  private renderEOList() {
    const eoListWrapper = document.getElementById(`${this.containerId}-eo-list-wrapper`) as HTMLDivElement;
    if (!eoListWrapper) return;
    eoListWrapper.innerHTML = "";
    if (!this.isEOView) return;

    const moveCounter = document.getElementById(`${this.containerId}-move-counter`);
    if (moveCounter) moveCounter.style.display = "none";

    if (this.eoList.length === 0) {
      this.eoList = [""];
      this.selectedEOIndex = 0;
    }

    const eoWithIndex = this.eoList.map((eo, idx) => ({
      eo,
      idx,
      count: this.countAllMoves(eo)
    }));
    eoWithIndex.sort((a, b) => {
      if (b.count !== a.count) return a.count - b.count;
      return a.idx - b.idx;
    });

    const selectedEO = this.eoList[this.selectedEOIndex];
    this.eoList = eoWithIndex.map(e => e.eo);
    this.selectedEOIndex = this.eoList.findIndex(eo => eo === selectedEO);

    this.eoList.forEach((eo, idx) => {
      const row = document.createElement("div");
      row.classList.add("eo-row");
      row.style.background = idx === this.selectedEOIndex ? "#e0e0e0" : "";
      row.textContent = eo || "(Double click to edit)";
      row.title = eo;

      let clickTimeout: number | null = null;
      row.addEventListener("click", (e) => {
        if (clickTimeout !== null) {
          clearTimeout(clickTimeout);
          clickTimeout = null;
          this.editEO(idx, eoListWrapper);
        } else {
          clickTimeout = window.setTimeout(() => {
            this.selectedEOIndex = idx;
            this.applyMoves(this.eoList[this.selectedEOIndex] || "", true);
            this.saveState();
            this.renderEOList();
            clickTimeout = null;
          }, 200);
        }
      });
      eoListWrapper.appendChild(row);
    });

    const addRow = document.createElement("div");
    addRow.className = "eo-add-row";
    const addButton = document.createElement("button");
    addButton.textContent = "+";
    addButton.title = "Add EO";
    addButton.className = "eo-add-button";
    addButton.addEventListener("click", () => {
      this.eoList.push("");
      this.selectedEOIndex = this.eoList.length - 1;
      this.saveState();
      this.renderEOList();
      this.applyMoves("", true);
    });
    addRow.appendChild(addButton);
    eoListWrapper.appendChild(addRow);
  }

  private editEO(idx: number, eoListWrapper: HTMLElement) {
    const eo = this.eoList[idx];
    const input = document.createElement("input");
    input.type = "text";
    input.value = eo;
    input.className = "eo-edit-input";
    input.addEventListener("input", () => {
      this.eoList[idx] = input.value;
      this.applyMoves(input.value, true);
      this.saveState();
    });
    input.addEventListener("blur", () => {
      this.eoList[idx] = input.value;
      this.saveState();
      this.renderEOList();
      this.applyMoves(this.eoList[this.selectedEOIndex] || "", true);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        input.blur();
      }
    });
    eoListWrapper.replaceChild(input, eoListWrapper.children[idx]);
    input.focus();
  }

  private saveEOListDimensions() {
    const eoListWrapper = document.getElementById(`${this.containerId}-eo-list-wrapper`) as HTMLDivElement;
    if (!eoListWrapper) return;
    const width = eoListWrapper.offsetWidth;
    const height = eoListWrapper.offsetHeight;
    const moveInput = document.getElementById(`${this.containerId}-move-input`) as HTMLTextAreaElement;
    if (moveInput) {
      moveInput.style.width = `${width}px`;
      moveInput.style.height = `${height}px`;
    }
    this.saveState();
  }
}
