import { TwistyPlayer } from "cubing/twisty";

const validMoves = new Set([
    "R", "R'", "R2", "L", "L'", "L2", "F", "F'", "F2", "B", "B'", "B2",
    "U", "U'", "U2", "D", "D'", "D2", "x", "y", "z",
    "Rw", "Rw2", "Rw'", "Lw", "Lw2", "Lw'", "Uw", "Uw2", "Uw'",
    "Dw", "Dw'", "Dw2", "Bw", "Bw'", "Bw2", "Fw", "Fw'", "Fw2"
]);

export class CubeView {
    private scramble: string;
    private inverseMoves: string = "";
    private normalMoves: string = "";
    private twistyPlayer: TwistyPlayer;
    private previousMoves: string = "";
    private containerId: string;

    constructor(scramble: string, containerId: string) {
        this.scramble = scramble;
        this.containerId = containerId;
        this.twistyPlayer = new TwistyPlayer({
            puzzle: "3x3x3",
            background: "none",
            controlPanel: "none"
        });
    }

    initialize() {
        let cubeContainer = document.getElementById(this.containerId);
        if (!cubeContainer) {
            cubeContainer = document.createElement("div");
            cubeContainer.id = this.containerId;
            cubeContainer.classList.add("cube-container");
            document.body.appendChild(cubeContainer);
        }
        cubeContainer.appendChild(this.twistyPlayer);

        const splitScramble = this.scramble.split(" ");
        splitScramble.forEach((move) => {
            this.twistyPlayer.experimentalAddMove(move);
        });

        this.initializeMoveInput();
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

        moveInput.addEventListener("input", () => this.applyMoves(moveInput.value.trim()));
    }

    private separateMoves(moves: string) {
        this.normalMoves = "";
        this.inverseMoves = "";

        let isInGroup = false;
        let groupBuffer = "";

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
                if (validMoves.has(move)) {
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
            if (move.endsWith("' ")) {
                inverseMoves += move.slice(0, -1);
            } else if (move.endsWith("2 ")) {
                inverseMoves += move;
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

    private applyMoves(moves: string) {
        moves = this.removeComments(moves);
        if (moves !== this.previousMoves) {
            this.previousMoves = moves;
            this.twistyPlayer.alg = "";
            this.separateMoves(moves);

            if (this.inverseMoves) {
                let invertedMoves = this.invertMoves(this.inverseMoves).split(" ");
                invertedMoves.forEach((move) => {
                    if (validMoves.has(move)) {
                        this.twistyPlayer.experimentalAddMove(move);
                    }
                });
            }

            if (this.scramble) {
                const scrambleMoves = this.scramble.split(" ");
                scrambleMoves.forEach((move) => {
                    if (validMoves.has(move)) {
                        this.twistyPlayer.experimentalAddMove(move);
                    }
                });
            }

            if (this.normalMoves) {
                const userMoves = this.normalMoves.split(" ");
                userMoves.forEach((move) => {
                    if (validMoves.has(move)) {
                        this.twistyPlayer.experimentalAddMove(move);
                    } else {
                        this.showToast(`Invalid move: ${move}`);
                    }
                });
            }
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
