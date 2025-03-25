import { TwistyPlayer } from "cubing/twisty";

const validMoveRegex = /^(R|L|F|B|U|D|x|y|z|Rw|Lw|Fw|Bw|Uw|Dw)(2|'|w2|w')?$/;

const blue = "#007bff";
const orange = "#ffa500";

export class CubeView {
    private scramble: string;
    private inverseMoves: string = "";
    private normalMoves: string = "";
    private twistyPlayer: TwistyPlayer;
    private previousMoves: string = "";
    private containerId: string;
    private isNormal: boolean = true;
    private isMinimized: boolean = false;

    constructor(scramble: string, containerId: string) {
        this.scramble = scramble;
        this.containerId = containerId;
        this.twistyPlayer = new TwistyPlayer({
            puzzle: "3x3x3",
            background: "none",
            controlPanel: "none",
            cameraLatitudeLimit: 99999999
        });
    }

    initialize() {
        let cubeContainer = document.getElementById(this.containerId);
        if (!cubeContainer) {
            cubeContainer = document.createElement("div");
            cubeContainer.id = this.containerId;
            cubeContainer.classList.add("cube-container");
            cubeContainer.style.position = "absolute";
            cubeContainer.style.top = "100px";
            cubeContainer.style.left = "100px";
            cubeContainer.style.zIndex = "1";
            document.body.appendChild(cubeContainer);

            cubeContainer.addEventListener("mousedown", () => {
                document.querySelectorAll(".cube-container").forEach((container) => {
                    (container as HTMLElement).style.zIndex = "1";
                });
                cubeContainer.style.zIndex = "10";
            });
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
            dragIcon.style.transform = "rotate(90deg)";
            cubeContainer.appendChild(dragIcon);

            let isDragging = false;
            let offsetX = 0;
            let offsetY = 0;

            dragIcon.addEventListener("mousedown", (event) => {
                isDragging = true;
                offsetX = event.clientX - cubeContainer.getBoundingClientRect().left;
                offsetY = event.clientY - cubeContainer.getBoundingClientRect().top;
                document.body.style.cursor = "grabbing";
            });

            document.addEventListener("mousemove", (event) => {
                if (isDragging) {
                    cubeContainer.style.left = `${event.clientX - offsetX}px`;
                    cubeContainer.style.top = `${event.clientY - offsetY}px`;
                }
            });

            document.addEventListener("mouseup", () => {
                if (isDragging) {
                    isDragging = false;
                    document.body.style.cursor = "default";
                }
            });

            dragIcon.addEventListener("touchstart", (event) => {
                isDragging = true;
                const touch = event.touches[0];
                offsetX = touch.clientX - cubeContainer.getBoundingClientRect().left;
                offsetY = touch.clientY - cubeContainer.getBoundingClientRect().top;
                event.preventDefault();
            });

            document.addEventListener("touchmove", (event) => {
                if (isDragging) {
                    const touch = event.touches[0];
                    cubeContainer.style.left = `${touch.clientX - offsetX}px`;
                    cubeContainer.style.top = `${touch.clientY - offsetY}px`;
                    event.preventDefault();
                }
            });

            document.addEventListener("touchend", () => {
                isDragging = false;
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
        let toggleButton = document.getElementById(toggleButtonId) as HTMLButtonElement;
        if (!toggleButton) {
            toggleButton = document.createElement("button");
            toggleButton.id = toggleButtonId;
            toggleButton.textContent = "Normal";
            toggleButton.classList.add("toggle-button", "button");
            toggleButton.addEventListener("click", () => this.toggleMode(toggleButton));
            columnWrapper.appendChild(toggleButton);
        }

        const moveInputId = `${this.containerId}-move-input`;
        let moveInput = document.getElementById(moveInputId) as HTMLTextAreaElement;
        if (!moveInput) {
            moveInput = document.createElement("textarea");
            moveInput.id = moveInputId;
            moveInput.classList.add("move-input");
            columnWrapper.appendChild(moveInput);
        }

        cubeContainer.insertBefore(this.twistyPlayer, columnWrapper);

        const splitScramble = this.scramble.split(" ");
        splitScramble.forEach((move) => {
            this.twistyPlayer.experimentalAddMove(move);
        });

        this.initializeMoveInput();
        this.updateMinimizedState();
    }

    private toggleMode(button: HTMLButtonElement) {
        this.isNormal = !this.isNormal;
        button.textContent = this.isNormal ? "Normal" : "Inverse";
        button.style.backgroundColor = this.isNormal ? blue : orange;
        this.applyMoves(this.previousMoves.trim(), true);
    }

    private toggleMinimized() {
        this.isMinimized = !this.isMinimized;
        this.updateMinimizedState();
    }

    private updateMinimizedState() {
        const cubeContainer = document.getElementById(this.containerId);
        const minimizeButton = document.getElementById(`${this.containerId}-minimize-button`);
        const moveInput = document.getElementById(`${this.containerId}-move-input`) as HTMLTextAreaElement;

        if (!cubeContainer || !minimizeButton) return;

        if (this.isMinimized) {
            minimizeButton.innerHTML = "+";
            minimizeButton.classList.add("maximize-button");
            minimizeButton.classList.remove("minimize-button");

            let textPreview = document.getElementById(`${this.containerId}-text-preview`);
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

            if (moveInput) {
                const text = moveInput.value || "";
                const firstLine = text.split("\n")[0] || "";
                const preview = firstLine.length > 30 ? firstLine.substring(0, 27) + "..." : firstLine;
                textPreview.textContent = preview || "(Empty)";
            } else {
                textPreview.textContent = "(Empty)";
            }

            Array.from(cubeContainer.children).forEach(child => {
                if (child.id !== `${this.containerId}-minimize-button` &&
                    child.id !== `${this.containerId}-text-preview`) {
                    (child as HTMLElement).style.display = "none";
                }
            });

            cubeContainer.classList.add("cube-container-minimized");
        } else {
            minimizeButton.innerHTML = "−";
            minimizeButton.classList.add("minimize-button");
            minimizeButton.classList.remove("maximize-button");

            const textPreview = document.getElementById(`${this.containerId}-text-preview`);
            if (textPreview) {
                textPreview.style.display = "none";
            }

            Array.from(cubeContainer.children).forEach(child => {
                if (child.id !== `${this.containerId}-text-preview`) {
                    (child as HTMLElement).style.display = "";
                }
            });

            cubeContainer.classList.remove("cube-container-minimized");
        }
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

        moveInput.addEventListener("input", (event) => {
            const input = event.target as HTMLTextAreaElement;
            const cursorPosition = input.selectionStart;

            if (input.value[cursorPosition - 1] === "(") {
                input.value = input.value.slice(0, cursorPosition) + ")" + input.value.slice(cursorPosition);
                input.selectionStart = input.selectionEnd = cursorPosition;
            }

            if (this.isMinimized) {
                const textPreview = document.getElementById(`${this.containerId}-text-preview`);
                if (textPreview) {
                    const text = moveInput.value || "";
                    const firstLine = text.split("\n")[0] || "";
                    const preview = firstLine.length > 30 ? firstLine.substring(0, 27) + "..." : firstLine;
                    textPreview.textContent = preview || "(Empty)";
                }
            }

            this.applyMoves(input.value.trim(), false);
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
            if (move.startsWith("(") && move.endsWith(")")) {
                this.inverseMoves += (this.inverseMoves ? " " : "") + move.slice(1, -1);
            } else if (move.startsWith("(")) {
                isInGroup = true;
                groupBuffer = move.slice(1);
            } else if (move.endsWith(")") && isInGroup) {
                groupBuffer += " " + move.slice(0, -1);
                this.inverseMoves += (this.inverseMoves ? " " : "") + groupBuffer.trim();
                groupBuffer = "";
                isInGroup = false;
            } else if (isInGroup) {
                groupBuffer += " " + move;
            } else {
                if (validMoveRegex.test(move)) {
                    this.normalMoves += (this.normalMoves ? " " : "") + move;
                }
            }
        });
        if (isInGroup && groupBuffer) {
            this.inverseMoves += (this.inverseMoves ? " " : "") + groupBuffer.trim();
        }
    }

    private invertMoves(moves: string): string {
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
            .map((line) => line.split("/")[0].trim())
            .filter((line) => line.length > 0)
            .join(" ");
    }

    private fixApostrophe(moves: string): string {
        return moves.replaceAll("‘", "'")
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
            }
            else {
                this.twistyPlayer.alg = this.invertMoves(this.scramble)
            }
            this.updateMoveCounter();
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
            }
            this.updateMoveCounter();
        }
    }

    private updateMoveCounter() {
        const moveCounter = document.getElementById(`${this.containerId}-move-counter`) as HTMLDivElement;
        if (moveCounter) {
            const normalMoveCount = this.normalMoves.trim().split(/\s+/).filter((move) => validMoveRegex.test(move)).length;
            const inverseMoveCount = this.inverseMoves.trim().split(/\s+/).filter((move) => validMoveRegex.test(move)).length;
            const totalMoves = normalMoveCount + inverseMoveCount;
            moveCounter.textContent = `Moves: ${totalMoves}`;
        }
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
}
