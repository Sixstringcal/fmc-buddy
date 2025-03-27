import { randomScrambleForEvent } from "cubing/scramble";
import { CubeView } from "./CubeView";
import { Timer } from "./Timer";
import { ScrambleView } from "./ScrambleView";
import { loadState } from "./stateManager";

let scramble: string = "";
let cubeViewCount = 0;
const cubeViews: CubeView[] = [];

(async () => {
    const documentContainer = document.createElement('div');
    documentContainer.id = 'document-container';
    documentContainer.className = 'document-container';
    document.body.appendChild(documentContainer);

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
        
        setTimeout(() => {
            const newCubeContainer = document.getElementById(`cube-container-${cubeViewCount}`);
            if (newCubeContainer) {
                updateDocumentBoundaries();
            }
        }, 100);

        scrambleView.registerCubeView(cubeView);
    });
    document.body.appendChild(addButton);

    cubeViewCount++;
    const cubeView = new CubeView(scramble, `cube-container-${cubeViewCount}`);
    cubeView.initialize();

    scrambleView.registerCubeView(cubeView);

    setTimeout(() => {
        updateDocumentBoundaries();
        document.querySelectorAll('.cube-container').forEach((container, index) => {
            const el = container as HTMLElement;
            if (!el.style.left || !el.style.top) {
                el.style.left = `${100}px`;
                el.style.top = `${100 + index * 50}px`;
            }
        });
    }, 500);
    
    window.addEventListener('resize', updateDocumentBoundaries);
    window.addEventListener('scroll', updateDocumentBoundaries);
    window.addEventListener('load', updateDocumentBoundaries);
})();

function updateDocumentBoundaries() {
    const containers = document.querySelectorAll('.cube-container');
    let maxRight = window.innerWidth;
    let maxBottom = window.innerHeight;
    
    containers.forEach(container => {
        const el = container as HTMLElement;
        const rect = el.getBoundingClientRect();
        
        const right = rect.right + window.scrollX + 300;
        const bottom = rect.bottom + window.scrollY + 300;
        
        maxRight = Math.max(maxRight, right);
        maxBottom = Math.max(maxBottom, bottom);
    });
    
    document.documentElement.style.minWidth = `${maxRight}px`;
    document.documentElement.style.minHeight = `${maxBottom}px`;
    document.body.style.minWidth = `${maxRight}px`;
    document.body.style.minHeight = `${maxBottom}px`;
}

export { };
