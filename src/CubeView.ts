import { TwistyPlayer } from "cubing/twisty";

const validMoveRegex = /^(R|L|F|B|U|D|x|y|z|Rw|Lw|Fw|Bw|Uw|Dw)(2|'|w2|w')?$/;

const BLUE = "#007bff";
const ORANGE = "#ffa500";

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
            cubeContainer.appendChild(dragIcon);

            let isDragging = false;
            let offsetX = 0;
            let offsetY = 0;

            dragIcon.addEventListener("mousedown", (event) => {
                isDragging = true;
                offsetX = event.clientX - cubeContainer.getBoundingClientRect().left;
                offsetY = event.clientY - cubeContainer.getBoundingClientRect().top;
                document.body.classList.add("grabbing");
            });

            document.addEventListener("mousemove", (event) => {
                if (isDragging) {
                    cubeContainer.style.left = `${event.clientX - offsetX}px`;
                    cubeContainer.style.top = `${event.clientY - offsetY}px`;
                    
                    // Update any connection lines while dragging
                    this.updateConnectionLines();
                }
            });

            document.addEventListener("mouseup", () => {
                if (isDragging) {
                    isDragging = false;
                    document.body.classList.remove("grabbing");
                    
                    // Final update for connection lines
                    this.updateConnectionLines();
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
                    
                    // Update any connection lines while dragging
                    this.updateConnectionLines();
                    
                    event.preventDefault();
                }
            });

            document.addEventListener("touchend", () => {
                isDragging = false;
                
                // Final update for connection lines
                this.updateConnectionLines();
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

        const rotationButtonContainerId = `${this.containerId}-rotation-buttons`;
        let rotationButtonContainer = document.getElementById(rotationButtonContainerId);
        if (!rotationButtonContainer) {
            rotationButtonContainer = document.createElement("div");
            rotationButtonContainer.id = rotationButtonContainerId;
            rotationButtonContainer.classList.add("rotation-button-container");
            columnWrapper.appendChild(rotationButtonContainer);
        }

        const rotationXButtonId = `${this.containerId}-rotation-x-button`;
        let rotationXButton = document.getElementById(rotationXButtonId) as HTMLButtonElement;
        if (!rotationXButton) {
            rotationXButton = document.createElement("button");
            rotationXButton.id = rotationXButtonId;
            rotationXButton.textContent = "x";
            rotationXButton.classList.add("rotation-button", "button");
            rotationXButton.addEventListener("click", () => this.toggleSecretRotation("x"));
            rotationButtonContainer.appendChild(rotationXButton);
        }

        const rotationXPrimeButtonId = `${this.containerId}-rotation-xprime-button`;
        let rotationXPrimeButton = document.getElementById(rotationXPrimeButtonId) as HTMLButtonElement;
        if (!rotationXPrimeButton) {
            rotationXPrimeButton = document.createElement("button");
            rotationXPrimeButton.id = rotationXPrimeButtonId;
            rotationXPrimeButton.textContent = "x'";
            rotationXPrimeButton.classList.add("rotation-button", "button");
            rotationXPrimeButton.addEventListener("click", () => this.toggleSecretRotation("x'"));
            rotationButtonContainer.appendChild(rotationXPrimeButton);
        }

        const rotationZButtonId = `${this.containerId}-rotation-z-button`;
        let rotationZButton = document.getElementById(rotationZButtonId) as HTMLButtonElement;
        if (!rotationZButton) {
            rotationZButton = document.createElement("button");
            rotationZButton.id = rotationZButtonId;
            rotationZButton.textContent = "z";
            rotationZButton.classList.add("rotation-button", "button");
            rotationZButton.addEventListener("click", () => this.toggleSecretRotation("z"));
            rotationButtonContainer.appendChild(rotationZButton);
        }

        const rotationZPrimeButtonId = `${this.containerId}-rotation-zprime-button`;
        let rotationZPrimeButton = document.getElementById(rotationZPrimeButtonId) as HTMLButtonElement;
        if (!rotationZPrimeButton) {
            rotationZPrimeButton = document.createElement("button");
            rotationZPrimeButton.id = rotationZPrimeButtonId;
            rotationZPrimeButton.textContent = "z'";
            rotationZPrimeButton.classList.add("rotation-button", "button");
            rotationZPrimeButton.addEventListener("click", () => this.toggleSecretRotation("z'"));
            rotationButtonContainer.appendChild(rotationZPrimeButton);
        }

        // Create a wrapper for input and duplicate button to place them side by side
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

        // Add duplicate button next to move input
        const duplicateButtonId = `${this.containerId}-duplicate-button`;
        let duplicateButton = document.getElementById(duplicateButtonId);
        if (!duplicateButton) {
            duplicateButton = document.createElement("button");
            duplicateButton.id = duplicateButtonId;
            duplicateButton.textContent = "+";
            duplicateButton.classList.add("duplicate-button");
            duplicateButton.style.marginLeft = "10px";
            duplicateButton.style.fontSize = "16px";
            duplicateButton.style.padding = "2px 8px";
            duplicateButton.style.borderRadius = "4px";
            duplicateButton.style.background = "#4CAF50";
            duplicateButton.style.color = "white";
            duplicateButton.style.border = "none";
            duplicateButton.style.cursor = "pointer";
            duplicateButton.style.alignSelf = "flex-start";
            duplicateButton.title = "Duplicate this cube view";
            
            duplicateButton.addEventListener("click", () => this.duplicateCubeView());
            inputWrapper.appendChild(duplicateButton);
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
        button.style.backgroundColor = this.isNormal ? BLUE : ORANGE;
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

        let previousValue = moveInput.value;

        moveInput.addEventListener("input", (event) => {
            const input = event.target as HTMLTextAreaElement;
            const cursorPosition = input.selectionStart;
            const currentValue = input.value;

            if (cursorPosition > 0 &&
                currentValue.length > previousValue.length &&
                currentValue[cursorPosition - 1] === "(") {

                input.value = currentValue.slice(0, cursorPosition) + ")" + currentValue.slice(cursorPosition);

                input.selectionStart = input.selectionEnd = cursorPosition;
            }

            previousValue = input.value;

            if (this.isMinimized) {
                const textPreview = document.getElementById(`${this.containerId}-text-preview`);
                if (textPreview) {
                    const text = input.value || "";
                    const firstLine = text.split("\n")[0] || "";
                    const preview = firstLine.length > 30 ? firstLine.substring(0, 27) + "..." : firstLine;
                    textPreview.textContent = preview || "(Empty)";
                }
            }

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
            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
                const input = event.target as HTMLTextAreaElement;
                const cursorPosition = input.selectionStart;
                const movesUpToCursor = input.value.substring(0, cursorPosition).trim();
                this.applyMoves(movesUpToCursor, false);
            }
        });

        moveInput.addEventListener('addTargetLine', (event: CustomEvent) => {
            const line = event.detail.line;
            if (line) {
                this.addTargetLine(line);
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

            if (this.secretRotation) {
                this.twistyPlayer.experimentalAddMove(this.secretRotation);
            }

            const moveCounter = document.getElementById(`${this.containerId}-move-counter`) as HTMLDivElement;
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

    private toggleSecretRotation(rotation: string) {
        if (this.secretRotation === rotation) {
            this.secretRotation = "";
        } else {
            this.secretRotation = rotation;
        }

        const rotationXButton = document.getElementById(`${this.containerId}-rotation-x-button`);
        const rotationXPrimeButton = document.getElementById(`${this.containerId}-rotation-xprime-button`);
        const rotationZButton = document.getElementById(`${this.containerId}-rotation-z-button`);
        const rotationZPrimeButton = document.getElementById(`${this.containerId}-rotation-zprime-button`);

        [rotationXButton, rotationXPrimeButton, rotationZButton, rotationZPrimeButton].forEach(button => {
            if (button) { button.style.backgroundColor = ""; button.style.color = BLUE; }
        });

        if (this.secretRotation) {
            const activeButton = {
                "x": rotationXButton,
                "x'": rotationXPrimeButton,
                "z": rotationZButton,
                "z'": rotationZPrimeButton
            }[this.secretRotation];

            if (activeButton) {
                activeButton.style.backgroundColor = BLUE;
                activeButton.style.color = "white";
            }
        }

        this.applyMoves(this.previousMoves, true);
    }

    // Add a method to duplicate the cube view
    private duplicateCubeView() {
        const moveInput = document.getElementById(`${this.containerId}-move-input`) as HTMLTextAreaElement;
        if (!moveInput) return;
        
        // Get the current content and cursor position
        const currentContent = moveInput.value;
        const cursorPosition = moveInput.selectionStart;
        
        // Create a unique ID for the new cube view
        const newContainerId = `cube-container-${Date.now()}`;
        
        // Create the new cube view with the same scramble
        const newCubeView = new CubeView(this.scramble, newContainerId);
        newCubeView.initialize();
        
        // Get the container elements for positioning
        const originalContainer = document.getElementById(this.containerId);
        const newContainer = document.getElementById(newContainerId);
        
        if (originalContainer && newContainer) {
            // Copy the content to the new cube view
            const newMoveInput = document.getElementById(`${newContainerId}-move-input`) as HTMLTextAreaElement;
            if (newMoveInput) {
                newMoveInput.value = currentContent;
                // Apply the same moves up to cursor
                this.applyMovesToNewCubeView(newCubeView, currentContent.substring(0, cursorPosition).trim());
            }
            
            // Position the new cube view to the right of the original
            const originalRect = originalContainer.getBoundingClientRect();
            newContainer.style.position = "absolute";
            newContainer.style.top = `${originalRect.top}px`;
            newContainer.style.left = `${originalRect.right + 50}px`; // 50px gap for the connection line
            
            // Create a visual connection between the cube views
            this.createConnectionLine(originalContainer, newContainer);
        }
    }
    
    // Apply moves to a new cube view
    private applyMovesToNewCubeView(cubeView: CubeView, moves: string) {
        const moveInput = document.getElementById(`${cubeView.getContainerId()}-move-input`) as HTMLTextAreaElement;
        if (moveInput) {
            moveInput.value = this.previousMoves;
            const cursorPosition = Math.min(moves.length, this.previousMoves.length);
            moveInput.selectionStart = moveInput.selectionEnd = cursorPosition;
            
            // Trigger the input event to update the cube
            const inputEvent = new Event('input', { bubbles: true });
            moveInput.dispatchEvent(inputEvent);
            
            // Also trigger click to update cursor position
            const clickEvent = new MouseEvent('click', { bubbles: true });
            moveInput.dispatchEvent(clickEvent);
        }
    }
    
    // Create a visual connection line between two cube containers
    private createConnectionLine(fromContainer: HTMLElement, toContainer: HTMLElement) {
        // Create line element
        const connectionLine = document.createElement("div");
        connectionLine.classList.add("connection-line");
        connectionLine.id = `connection-${fromContainer.id}-${toContainer.id}`;
        
        // Store container IDs as data attributes for later updates
        connectionLine.setAttribute('data-source', fromContainer.id);
        connectionLine.setAttribute('data-target', toContainer.id);
        
        document.body.appendChild(connectionLine);
        
        // Style the line
        connectionLine.style.position = "absolute";
        connectionLine.style.height = "2px";
        connectionLine.style.backgroundColor = "#4CAF50";
        connectionLine.style.zIndex = "1";
        
        // Add a subtle transition for smooth updates when dragging
        connectionLine.style.transition = "all 0.05s ease-out";
        
        // Store this line for this cube view (source)
        this.sourceLines.push(connectionLine);
        
        // Find the target cube view and store the line there too
        const targetCubeViewElements = document.querySelectorAll('.cube-container');
        for (let i = 0; i < targetCubeViewElements.length; i++) {
            const element = targetCubeViewElements[i] as HTMLElement;
            if (element.id === toContainer.id) {
                // Found the target container, now find its CubeView instance
                const targetId = element.id;
                setTimeout(() => {
                    // Use a short timeout to ensure the CubeView instance is fully initialized
                    const moveInput = document.getElementById(`${targetId}-move-input`);
                    if (moveInput) {
                        // If we can find the move input, the CubeView is properly initialized
                        // Use a custom event to add the line to the target CubeView
                        const event = new CustomEvent('addTargetLine', { 
                            detail: { line: connectionLine }
                        });
                        moveInput.dispatchEvent(event);
                    }
                }, 100);
                break;
            }
        }
        
        // Initial positioning
        this.updateConnectionLinePosition(connectionLine, fromContainer, toContainer);
        
        // Update position when window is resized
        window.addEventListener("resize", () => {
            this.updateConnectionLinePosition(connectionLine, fromContainer, toContainer);
        });
    }
    
    // Method to add a line where this cube is the target
    public addTargetLine(line: HTMLElement) {
        this.targetLines.push(line);
    }

    // Add property to track connection lines
    private sourceLines: HTMLElement[] = []; // Lines where this cube is the source
    private targetLines: HTMLElement[] = []; // Lines where this cube is the target
    
    // Method to update all connection lines related to this cube view
    private updateConnectionLines() {
        // Update all source lines
        this.sourceLines.forEach(line => {
            const sourceId = this.containerId;
            const targetId = line.getAttribute('data-target');
            if (targetId) {
                const sourceContainer = document.getElementById(sourceId);
                const targetContainer = document.getElementById(targetId);
                if (sourceContainer && targetContainer) {
                    this.updateConnectionLinePosition(line, sourceContainer, targetContainer);
                }
            }
        });
        
        // Update all target lines
        this.targetLines.forEach(line => {
            const sourceId = line.getAttribute('data-source');
            const targetId = this.containerId;
            if (sourceId) {
                const sourceContainer = document.getElementById(sourceId);
                const targetContainer = document.getElementById(targetId);
                if (sourceContainer && targetContainer) {
                    this.updateConnectionLinePosition(line, sourceContainer, targetContainer);
                }
            }
        });
    }
    
    // Method to update a single connection line position
    private updateConnectionLinePosition(line: HTMLElement, fromContainer: HTMLElement, toContainer: HTMLElement) {
        const fromRect = fromContainer.getBoundingClientRect();
        const toRect = toContainer.getBoundingClientRect();
            
        // Position at the middle height of containers
        const fromY = fromRect.top + fromRect.height / 2;
        const toY = toRect.top + toRect.height / 2;
            
        // Connect from right side of original to left side of new
        const fromX = fromRect.right;
        const toX = toRect.left;
        
        // Calculate the angle and length for the diagonal line
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const length = Math.sqrt(dx * dx + dy * dy);
            
        // Position and size the line
        line.style.width = `${length}px`;
        line.style.left = `${fromX}px`;
        line.style.top = `${fromY}px`;
        line.style.transformOrigin = '0 0'; // Set transform origin to the left side
        line.style.transform = `rotate(${angle}deg)`; // Rotate the line to correct angle
    }

    // Make sure CubeView can be accessed from other CubeViews
    public getContainerId(): string {
        return this.containerId;
    }
}
