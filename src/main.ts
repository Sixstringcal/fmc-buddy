import { TwistyPlayer } from "cubing/twisty";
import { randomScrambleForEvent } from "cubing/scramble";

let scramble: string = "";
let inverse: string = "";

const validMoves = new Set([
    "R", "R'", "R2", "L", "L'", "L2", "F", "F'", "F2", "B", "B'", "B2",
    "U", "U'", "U2", "D", "D'", "D2", "x", "y", "z",
    "Rw", "Rw2", "Rw'", "Lw", "Lw2", "Lw'", "Uw", "Uw2", "Uw'",
    "Dw", "Dw'", "Dw2", "Bw", "Bw'", "Bw2", "Fw", "Fw'", "Fw2"
]);

function showToast(message: string) {
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

document.addEventListener("DOMContentLoaded", async () => {
    // Ensure scramble container exists
    let scrambleContainer = document.getElementById("scramble-container");
    if (!scrambleContainer) {
        scrambleContainer = document.createElement("div");
        scrambleContainer.id = "scramble-container";
        scrambleContainer.classList.add("scramble-container-swag"); // Add styling class

        const scrambleLabel = document.createElement("div");
        scrambleLabel.textContent = "Scramble:";
        scrambleLabel.classList.add("scramble-label-swag"); // Add label styling class
        scrambleContainer.appendChild(scrambleLabel);

        const scrambleText = document.createElement("div");
        scrambleText.id = "scramble-text";
        scrambleContainer.appendChild(scrambleText);

        document.body.prepend(scrambleContainer); // Add it to the top of the page
    }

    // Generate and display a random scramble
    const scrambleText = document.getElementById("scramble-text");
    if (scrambleText) {
        scramble = (await randomScrambleForEvent("333")).toString(); // Generate scramble for 3x3x3
        scrambleText.textContent = scramble; // Display scramble
    }

    // Create and display the cube
    const cubeContainer = document.getElementById("cube-container");
    cubeContainer?.classList.add("cube-container-swag"); // Add styling class

    const twistyPlayer = new TwistyPlayer({
        puzzle: "3x3x3",
        background: "none",
        controlPanel: "none"
    });
    cubeContainer?.appendChild(twistyPlayer);

    const splitScramble = scramble.toString().split(" ");
    splitScramble.forEach((move) => {
        twistyPlayer.experimentalAddMove(move);
    });

    // Handle move input
    const moveInput = document.getElementById("move-input") as HTMLTextAreaElement; // Change to HTMLTextAreaElement
    moveInput?.classList.add("move-input-swag"); // Add styling class
    let previousMoves = ""; // Track the previous trimmed input value

    moveInput?.addEventListener("input", () => {
        const moves = moveInput.value.trim();
        if (moves !== previousMoves) { // Only process if the trimmed value has changed
            previousMoves = moves;
            twistyPlayer.alg = ""; // Clear the algorithm in the player
            inverse = ""; // Reset the inverse string

            // Add scramble moves first
            if (scramble) {
                const scrambleMoves = scramble.split(" ");
                scrambleMoves.forEach((move) => {
                    if (validMoves.has(move)) {
                        twistyPlayer.experimentalAddMove(move);
                    }
                });
            }

            // Add user input moves
            if (moves) {
                console.log(inverse);
                const userMoves = moves.split(" ");
                userMoves.forEach((move) => {
                    if (move.startsWith("(") && move.endsWith(")")) {
                        // Extract moves inside parentheses and append to inverse
                        const sequence = move.slice(1, -1).trim();
                        if (sequence) {
                            inverse += (inverse ? " " : "") + sequence;
                        }
                    } else if (validMoves.has(move)) {
                        twistyPlayer.experimentalAddMove(move);
                    } else {
                        showToast(`Invalid move: ${move}`);
                    }
                });
            }
        }
    });
});

export { };
