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

    private applyMoves(moves: string) {
        if (moves !== this.previousMoves) {
            this.previousMoves = moves;
            this.twistyPlayer.alg = "";
            this.inverseMoves = "";

            if (this.scramble) {
                const scrambleMoves = this.scramble.split(" ");
                scrambleMoves.forEach((move) => {
                    if (validMoves.has(move)) {
                        this.twistyPlayer.experimentalAddMove(move);
                    }
                });
            }

            if (moves) {
                const userMoves = moves.split(" ");
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
