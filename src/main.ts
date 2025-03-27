import { randomScrambleForEvent } from "cubing/scramble";
import { CubeView } from "./CubeView";
import { Timer } from "./Timer";
import { ScrambleView } from "./ScrambleView";
import { loadState, saveState } from "./stateManager";

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
        saveState("scramble", scramble);
    }
    scrambleView.updateScramble(scramble);

    const timer = new Timer(60 * 60, () => {
        alert("Time's up!");
    });

    const addButton = document.createElement("button");
    addButton.textContent = "+";
    addButton.classList.add("add-button");
    addButton.addEventListener("click", () => {
        createNewCubeView();
    });
    document.body.appendChild(addButton);

    await loadSavedCubeViews(scrambleView);

    if (cubeViews.length === 0) {
        createNewCubeView();
    }

    setTimeout(() => {
        restoreConnections();
    }, 1000);

    setTimeout(() => {
        updateDocumentBoundaries();
    }, 500);
    
    window.addEventListener('resize', updateDocumentBoundaries);
    window.addEventListener('scroll', updateDocumentBoundaries);
    window.addEventListener('load', updateDocumentBoundaries);
    
    setInterval(() => {
        saveState("scramble", scramble);
    }, 5000);
})();

async function loadSavedCubeViews(scrambleView: ScrambleView) {
    const savedCount = loadState<number>("cubeViewCount", 0);
    const savedViewIds = loadState<string[]>("cubeViewIds", []);
    
    cubeViewCount = Math.max(savedCount, 0);
    
    for (const viewId of savedViewIds) {
        const viewState = loadState(`cubeView_${viewId}`, null);
        if (viewState) {
            const cubeView = new CubeView(scramble, viewId, viewState);
            cubeView.initialize();
            cubeViews.push(cubeView);
            scrambleView.registerCubeView(cubeView);
        }
    }
}

function restoreConnections() {
    const connections = loadState<{sourceId: string, targetId: string}[]>("cubeViewConnections", []);
    
    for (const connection of connections) {
        const sourceView = cubeViews.find(view => view.getContainerId() === connection.sourceId);
        if (sourceView) {
            sourceView.createConnectionFromState(connection.targetId);
        }
    }
}

function createNewCubeView() {
    cubeViewCount++;
    const containerId = `cube-container-${cubeViewCount}`;
    const cubeView = new CubeView(scramble, containerId);
    cubeView.initialize();
    cubeViews.push(cubeView);
    
    setTimeout(() => {
        const newCubeContainer = document.getElementById(containerId);
        if (newCubeContainer) {
            if (!newCubeContainer.style.left || !newCubeContainer.style.top) {
                newCubeContainer.style.left = `${100 + (cubeViewCount * 20)}px`;
                newCubeContainer.style.top = `${100 + (cubeViewCount * 20)}px`;
            }
            updateDocumentBoundaries();
            cubeView.saveState();
        }
    }, 100);
}

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
