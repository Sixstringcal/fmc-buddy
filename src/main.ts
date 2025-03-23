import { randomScrambleForEvent } from "cubing/scramble";
import { CubeView } from "./CubeView";

let scramble: string = "";

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

    const cubeView = new CubeView(scramble, "cube-container-1");
    cubeView.initialize();
});

export { };
