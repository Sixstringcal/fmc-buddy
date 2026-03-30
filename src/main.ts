import { AppViewModel } from "./viewmodels/AppViewModel";
import { ScrambleView } from "./views/ScrambleView";
import { TimerView } from "./views/TimerView";
import { CubeView } from "./views/CubeView";
import { generateNewScramble } from "./actions/scrambleActions";
import { throttle } from "./utils/throttle";
import { AppRepository } from "./repositories/AppRepository";
import { ConnectionRecord } from "./models/types";

window.addEventListener("DOMContentLoaded", () => {
    initializeApp().catch((err) => {
        console.error("initializeApp failed:", err);
        document.body.innerHTML = `
      <div style="padding:2rem;font-family:monospace;color:red;">
        <h2>App failed to start</h2>
        <pre>${String(err?.stack ?? err)}</pre>
      </div>`;
    });
});

async function initializeApp(): Promise<void> {
    const loading = createLoadingOverlay();
    const appVm = new AppViewModel();
    const scrambleView = new ScrambleView("");
    scrambleView.bindViewModel(appVm.scrambleVm);
    scrambleView.initialize();

    await appVm.bootstrap();
    if (!appVm.scrambleVm.scramble.get().trim()) {
        await generateNewScramble(appVm.scrambleVm);
    }

    appVm.timerVm.onExpired = () => alert("Time's up!");
    const timerView = new TimerView(appVm.timerVm);
    const timerEl = timerView.getElement();
    timerEl.classList.add("fixed-timer");
    document.body.appendChild(timerEl);

    const addButton = document.createElement("button");
    addButton.textContent = "+";
    addButton.classList.add("add-button");
    addButton.addEventListener("click", () => spawnNewNode(appVm));
    document.body.appendChild(addButton);

    const cubeViews: CubeView[] = [];

    if (appVm.cubeNodes.get().length > 0) {
        for (const vm of appVm.cubeNodes.get()) {
            const view = new CubeView(appVm, vm);
            view.initialize();
            cubeViews.push(view);
        }
    } else {
        cubeViews.push(spawnNewNode(appVm));
    }

    restoreConnections(appVm, cubeViews);
    CubeView.markConnectionsLoaded();

    for (const view of cubeViews) {
        try {
            view.forceUpdateConnections();
        } catch (e) {
            console.error("Error updating connections:", e);
        }
    }

    appVm.scrambleVm.scramble.subscribe((_scramble) => { });

    patchScrambleRefresh(appVm, cubeViews);

    updateDocumentBoundaries();
    const throttledUpdate = throttle(updateDocumentBoundaries, 100);
    window.addEventListener("resize", throttledUpdate);
    window.addEventListener("scroll", throttledUpdate);
    window.addEventListener("load", updateDocumentBoundaries);

    hideLoadingOverlay(loading);
}

function spawnNewNode(appVm: AppViewModel): CubeView {
    const vm = appVm.createCubeNode();
    const view = new CubeView(appVm, vm);
    view.initialize();

    requestAnimationFrame(() => {
        const container = document.getElementById(vm.id);
        if (container) {
            const nodeCount = appVm.cubeNodes.get().length;
            if (!container.style.left) {
                container.style.left = `${100 + nodeCount * 20}px`;
                container.style.top = `${100 + nodeCount * 20}px`;
            }
            updateDocumentBoundaries();
        }
    });

    return view;
}

function restoreConnections(
    appVm: AppViewModel,
    views: CubeView[],
): void {
    const connections: ConnectionRecord[] = AppRepository.loadConnections();
    if (connections.length === 0) return;

    const allIds = new Set(
        Array.from(document.querySelectorAll(".cube-container")).map((el) => el.id),
    );

    for (const { sourceId, targetId } of connections) {
        if (!allIds.has(sourceId) || !allIds.has(targetId)) {
            console.warn(`Skipping connection restore: ${sourceId} → ${targetId}`);
            continue;
        }
        const sourceView = views.find((v) => v.getContainerId() === sourceId);
        sourceView?.createConnectionFromState(targetId);
    }

    for (const view of views) {
        view.initializeConnections();
    }
}

function patchScrambleRefresh(
    appVm: AppViewModel,
    cubeViews: CubeView[],
): void {
    const btn = document.querySelector<HTMLButtonElement>(".new-scramble-button");
    if (!btn) return;

    const clone = btn.cloneNode(true) as HTMLButtonElement;
    btn.replaceWith(clone);

    clone.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to restart?")) return;

        for (const view of cubeViews) {
            const container = document.getElementById(view.getContainerId());
            container?.remove();
        }
        document.querySelectorAll(".connection-line, .connection-arrow").forEach(
            (el) => el.remove(),
        );
        cubeViews.length = 0;

        appVm.reset();

        const { generateNewScramble: gen } = await import("./actions/scrambleActions");
        await gen(appVm.scrambleVm);

        cubeViews.push(spawnNewNode(appVm));
        CubeView.markConnectionsLoaded();
    });
}

function createLoadingOverlay(): HTMLElement {
    const overlay = document.createElement("div");
    overlay.id = "loading-overlay";

    const spinner = document.createElement("div");
    spinner.classList.add("loading-spinner");

    const text = document.createElement("p");
    text.textContent = "Loading...";

    overlay.appendChild(spinner);
    overlay.appendChild(text);
    document.body.appendChild(overlay);
    return overlay;
}

function hideLoadingOverlay(overlay: HTMLElement): void {
    overlay.style.opacity = "0";
    setTimeout(() => overlay.remove(), 101);
}

function updateDocumentBoundaries(): void {
    const containers = document.querySelectorAll<HTMLElement>(".cube-container");
    let maxRight = window.innerWidth;
    let maxBottom = window.innerHeight;

    for (const el of Array.from(containers)) {
        const r = el.getBoundingClientRect();
        maxRight = Math.max(maxRight, r.right + window.scrollX + 300);
        maxBottom = Math.max(maxBottom, r.bottom + window.scrollY + 300);
    }

    document.documentElement.style.minWidth = `${maxRight}px`;
    document.documentElement.style.minHeight = `${maxBottom}px`;
    document.body.style.minWidth = `${maxRight}px`;
    document.body.style.minHeight = `${maxBottom}px`;
}

export { };
