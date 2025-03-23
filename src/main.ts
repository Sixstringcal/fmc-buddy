import { randomScrambleForEvent } from "cubing/scramble";
import { CubeView } from "./CubeView";

let scramble: string = "";

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

    // Initialize CubeView component with a unique container ID
    const cubeView = new CubeView(scramble, "cube-container-1");
    cubeView.initialize();
});

export { };
