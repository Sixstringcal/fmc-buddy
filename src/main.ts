import { randomScrambleForEvent } from "cubing/scramble";
import { CubeView } from "./CubeView";
import { Timer } from "./Timer";
import { ScrambleView } from "./ScrambleView";
import { loadState } from "./stateManager";

let scramble: string = "";
let cubeViewCount = 0;
const cubeViews: CubeView[] = [];

(async () => {
    const scrambleView = new ScrambleView("");
    scrambleView.initialize();

    scramble = loadState("scramble", "");
    if (scramble.trim() === "") {
        scramble = (await randomScrambleForEvent("333fm")).toString();
    }
    scrambleView.updateScramble(scramble);

    const timer = new Timer(60 * 60, () => {
        alert("Time's up!");
    });

    const addButton = document.createElement("button");
    addButton.textContent = "+";
    addButton.classList.add("add-button");
    addButton.addEventListener("click", () => {
        cubeViewCount++;
        const cubeView = new CubeView(scramble, `cube-container-${cubeViewCount}`);
        cubeView.initialize();

        scrambleView.registerCubeView(cubeView);
    });
    document.body.appendChild(addButton);

    cubeViewCount++;
    const cubeView = new CubeView(scramble, `cube-container-${cubeViewCount}`);
    cubeView.initialize();

    scrambleView.registerCubeView(cubeView);
})();

export { };
