import { randomScrambleForEvent } from "cubing/scramble";
import { CubeView } from "./CubeView";

let scramble: string = "";
let cubeViewCount = 0;

const addLoadingSpinner = () => {
    const spinner = document.createElement("div");
    spinner.id = "loading-spinner";
    spinner.classList.add("loading-spinner");
    document.body.appendChild(spinner);
};

const removeLoadingSpinner = () => {
    const spinner = document.getElementById("loading-spinner");
    if (spinner) {
        spinner.remove();
    }
};

(async () => {
    addLoadingSpinner();

    scramble = (await randomScrambleForEvent("333fm")).toString();

    const scrambleContainer = document.createElement("div");
    scrambleContainer.id = "scramble-container";
    scrambleContainer.classList.add("scramble-container");

    const scrambleLabel = document.createElement("div");
    scrambleLabel.textContent = "Scramble:";
    scrambleLabel.classList.add("scramble-label");
    scrambleContainer.appendChild(scrambleLabel);

    const scrambleText = document.createElement("div");
    scrambleText.id = "scramble-text";
    scrambleText.textContent = scramble;
    scrambleContainer.appendChild(scrambleText);

    document.body.prepend(scrambleContainer);

    const addButton = document.createElement("button");
    addButton.textContent = "+";
    addButton.classList.add("add-button");
    addButton.addEventListener("click", () => {
        cubeViewCount++;
        const cubeView = new CubeView(scramble, `cube-container-${cubeViewCount}`);
        cubeView.initialize();
    });
    document.body.appendChild(addButton);

    cubeViewCount++;
    const cubeView = new CubeView(scramble, `cube-container-${cubeViewCount}`);
    cubeView.initialize();

    removeLoadingSpinner();
})();

export { };
