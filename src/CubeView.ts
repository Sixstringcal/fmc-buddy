import { TwistyPlayer } from "cubing/twisty";

const validMoves = new Set([
    "R", "R'", "R2", "L", "L'", "L2", "F", "F'", "F2", "B", "B'", "B2",
    "U", "U'", "U2", "D", "D'", "D2", "x", "y", "z",
    "Rw", "Rw2", "Rw'", "Lw", "Lw2", "Lw'", "Uw", "Uw2", "Uw'",
    "Dw", "Dw'", "Dw2", "Bw", "Bw'", "Bw2", "Fw", "Fw'", "Fw2"
]);

export class CubeView {
    private scramble: string;
    private inverse: string = "";
    private twistyPlayer: TwistyPlayer;
    private previousMoves: string = "";

    constructor(scramble: string) {
        this.scramble = scramble;
        this.twistyPlayer = new TwistyPlayer({
            puzzle: "3x3x3",
            background: "none",
            controlPanel: "none"
        });
    }

    initialize() {
        // Ensure cube container exists
        let cubeContainer = document.getElementById("cube-container");
        if (!cubeContainer) {
            cubeContainer = document.createElement("div");
            cubeContainer.id = "cube-container";
            cubeContainer.classList.add("cube-container-swag"); // Add styling class
            document.body.appendChild(cubeContainer);
        }
        cubeContainer.appendChild(this.twistyPlayer);

        // Apply scramble moves
        const splitScramble = this.scramble.split(" ");
        splitScramble.forEach((move) => {
            this.twistyPlayer.experimentalAddMove(move);
        });

        // Initialize move input listener
        this.initializeMoveInput();
    }

    private initializeMoveInput() {
        const moveInput = document.getElementById("move-input") as HTMLTextAreaElement;
        if (!moveInput) return;

        moveInput.classList.add("move-input-swag"); // Add styling class

        moveInput.addEventListener("input", () => {
            const moves = moveInput.value.trim();
            if (moves !== this.previousMoves) { // Only process if the trimmed value has changed
                this.previousMoves = moves;
                this.twistyPlayer.alg = ""; // Clear the algorithm in the player
                this.inverse = ""; // Reset the inverse string

                // Add scramble moves first
                if (this.scramble) {
                    const scrambleMoves = this.scramble.split(" ");
                    scrambleMoves.forEach((move) => {
                        if (validMoves.has(move)) {
                            this.twistyPlayer.experimentalAddMove(move);
                        }
                    });
                }

                // Add user input moves
                if (moves) {
                    const userMoves = moves.split(" ");
                    userMoves.forEach((move) => {
                        if (move.startsWith("(") && move.endsWith(")")) {
                            // Extract moves inside parentheses and append to inverse
                            const sequence = move.slice(1, -1).trim();
                            if (sequence) {
                                this.inverse += (this.inverse ? " " : "") + sequence;
                            }
                        } else if (validMoves.has(move)) {
                            this.twistyPlayer.experimentalAddMove(move);
                        } else {
                            this.showToast(`Invalid move: ${move}`);
                        }
                    });
                }
            }
        });
    }

    private showToast(message: string) {
        let toast = document.getElementById("toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "toast";
            toast.classList.add("toast-swag");
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }
}
