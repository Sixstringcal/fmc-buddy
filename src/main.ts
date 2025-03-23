import { randomScrambleForEvent } from "cubing/scramble";
import { CubeView } from "./CubeView";

let scramble: string = "";
let cubeViewCount = 0;

document.addEventListener("DOMContentLoaded", async () => {
    let scrambleContainer = document.getElementById("scramble-container");
    if (!scrambleContainer) {
        scrambleContainer = document.createElement("div");
        scrambleContainer.id = "scramble-container";
        scrambleContainer.classList.add("scramble-container");

        const scrambleLabel = document.createElement("div");
        scrambleLabel.textContent = "Scramble:";
        scrambleLabel.classList.add("scramble-label");
        scrambleContainer.appendChild(scrambleLabel);

        const scrambleText = document.createElement("div");
        scrambleText.id = "scramble-text";
        scrambleContainer.appendChild(scrambleText);

        document.body.prepend(scrambleContainer);
    }

    const scrambleText = document.getElementById("scramble-text");
    if (scrambleText) {
        scramble = (await randomScrambleForEvent("333fm")).toString();
        scrambleText.textContent = scramble;
    }

    // Add "+" button to create new CubeViews
    const addButton = document.createElement("button");
    addButton.textContent = "+";
    addButton.classList.add("add-button");
    addButton.addEventListener("click", async () => {
        cubeViewCount++;
        const cubeView = new CubeView(scramble, `cube-container-${cubeViewCount}`);
        cubeView.initialize();
    });
    document.body.appendChild(addButton);

    // Initialize the first CubeView
    cubeViewCount++;
    const cubeView = new CubeView(scramble, `cube-container-${cubeViewCount}`);
    cubeView.initialize();
});

export { };
