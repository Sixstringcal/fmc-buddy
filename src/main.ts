import { randomScrambleForEvent } from "cubing/scramble";
import { CubeView } from "./CubeView";
import { Timer } from "./Timer";
import { ScrambleView } from "./ScrambleView";
import { loadState, saveState, clearLocalStorage } from "./stateManager";

let scramble: string = "";
let cubeViewCount = 0;
const cubeViews: CubeView[] = [];
let scrambleView: ScrambleView;

function createLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    
    const spinner = document.createElement('div');
    spinner.classList.add('loading-spinner');
    
    const text = document.createElement('p');
    text.textContent = 'Loading...';
    
    overlay.appendChild(spinner);
    overlay.appendChild(text);
    document.body.appendChild(overlay);
    
    return overlay;
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
        }, 101); 
    }
}

function initializeApp() {
    (async () => {
        const loadingOverlay = createLoadingOverlay();

        const documentContainer = document.createElement('div');
        documentContainer.id = 'document-container';
        documentContainer.className = 'document-container';
        document.body.appendChild(documentContainer);

        scrambleView = new ScrambleView("");
        scrambleView.initialize();
        
        scrambleView.onRefreshScramble(refreshScramble);

        scramble = loadState("scramble", "");
        if (scramble.trim() === "") {
            scramble = (await randomScrambleForEvent("333fm")).toString();
        }
        scrambleView.updateScramble(scramble);

        const timer = new Timer(60 * 60, () => {
            alert("Time's up!");
        });

        const timerElement = timer.getElement();
        timerElement.classList.add("fixed-timer");
        document.body.appendChild(timerElement);

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

            for (let i = 1; i <= 5; i++) {
                setTimeout(() => {
                    cubeViews.forEach(view => {
                        try {
                            view.forceUpdateConnections();
                        } catch (e) {
                            console.error(`Error updating connections for ${view.getContainerId()}:`, e);
                        }
                    });
                    
                    if (i === 5) {
                        CubeView.markConnectionsLoaded();
                        
                        setTimeout(() => {
                            cubeViews.forEach(view => view.forceUpdateConnections());
                            hideLoadingOverlay();
                        }, 100);
                    }
                }, i * 100); 
            }
        }, 100);

        setTimeout(() => {
            updateDocumentBoundaries();
        }, 500);
        
        window.addEventListener('resize', updateDocumentBoundaries);
        window.addEventListener('scroll', updateDocumentBoundaries);
        window.addEventListener('load', updateDocumentBoundaries);
    })();
}

window.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function refreshScramble() {
    clearLocalStorage();
    
    scramble = (await randomScrambleForEvent("333fm")).toString();
    
    scrambleView.updateScramble(scramble);
    
    cubeViews.length = 0;
    cubeViewCount = 0;
    
    createNewCubeView();
}

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
    
    sessionStorage.setItem('connectionsBackup', JSON.stringify(connections));
    
    if (connections.length === 0) {
        CubeView.markConnectionsLoaded();
        return;
    }
    
    const allContainers = document.querySelectorAll('.cube-container');
    const containerIds = Array.from(allContainers).map(c => c.id);
    
    for (const connection of connections) {
        if (!containerIds.includes(connection.sourceId) || !containerIds.includes(connection.targetId)) {
            console.warn(`Cannot restore connection: ${connection.sourceId} -> ${connection.targetId} (container not found)`);
            continue;
        }
        
        const sourceView = cubeViews.find(view => view.getContainerId() === connection.sourceId);
        if (sourceView) {
            sourceView.createConnectionFromState(connection.targetId);
        } else {
            console.warn(`Source view not found: ${connection.sourceId}`);
        }
    }
    
    cubeViews.forEach(view => {
        view.initializeConnections();
    });
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
