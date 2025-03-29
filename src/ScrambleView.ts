import { saveState } from "./stateManager";
import { randomScrambleForEvent } from "cubing/scramble";
import { CubeView } from "./CubeView";

export class ScrambleView {
    private scramble: string;
    private scrambleContainer: HTMLElement;
    private scrambleText: HTMLElement;
    private inverseScrambleText: HTMLElement;
    private showingInverse: boolean = false;
    private cubeViews: CubeView[] = [];
    private inverseButton: HTMLButtonElement;
    private refreshScrambleCallback: (() => Promise<void>) | null = null;

    constructor(scramble: string) {
        this.scramble = scramble;
        this.scrambleContainer = document.createElement("div");
        this.scrambleText = document.createElement("div");
        this.inverseScrambleText = document.createElement("div");
        this.inverseButton = document.createElement("button");
    }

    initialize() {
        this.scrambleContainer.id = "scramble-container";
        this.scrambleContainer.classList.add("scramble-container");
        this.scrambleContainer.style.position = "absolute";
        this.scrambleContainer.style.top = "0";
        this.scrambleContainer.style.left = "0";

        const scrambleLabel = document.createElement("div");
        scrambleLabel.textContent = "Scramble:";
        scrambleLabel.classList.add("scramble-label");
        this.scrambleContainer.appendChild(scrambleLabel);

        this.scrambleText.id = "scramble-text";
        this.scrambleText.textContent = this.scramble;
        this.scrambleContainer.appendChild(this.scrambleText);

        this.addEditButton();
        this.addInverseScrambleButton();
        this.addNewScrambleButton();
        document.body.insertBefore(this.scrambleContainer, document.body.firstChild);
    }

    private addEditButton() {
        const editButton = document.createElement("button");
        editButton.innerHTML = "✏️";
        editButton.classList.add("edit-button");

        let isEditing = false;

        const toggleEdit = () => {
            if (isEditing) {
                const input = this.scrambleContainer.querySelector("input") as HTMLInputElement;
                if (input) {
                    this.updateScramble(input.value);
                    input.remove();
                }
                editButton.textContent = "✏️";
            } else {
                const input = document.createElement("input");
                input.type = "text";
                input.value = this.scrambleText.textContent || "";
                input.classList.add("scramble-input");
                this.scrambleContainer.insertBefore(input, this.scrambleText);
                this.scrambleText.textContent = "";
                input.select();
                input.addEventListener("input", () => {
                    this.updateScramble(input.value);
                });
                input.addEventListener("keydown", (event) => {
                    if (event.key === "Enter") {
                        toggleEdit();
                    }
                });
                editButton.textContent = "✔️";
            }
            isEditing = !isEditing;
        };

        editButton.addEventListener("click", toggleEdit);
        this.scrambleContainer.appendChild(editButton);
    }

    private addInverseScrambleButton() {
        this.inverseButton.textContent = "Show inverse";
        this.inverseButton.classList.add("inverse-button");
        this.inverseButton.title = "Toggle inverse scramble";

        this.inverseScrambleText.id = "inverse-scramble-text";
        this.inverseScrambleText.classList.add("inverse-scramble");
        this.inverseScrambleText.style.display = "none";
        this.scrambleContainer.appendChild(this.inverseScrambleText);

        this.inverseButton.addEventListener("click", () => {
            this.toggleInverseScramble();
        });

        this.scrambleContainer.appendChild(this.inverseButton);
    }

    private toggleInverseScramble() {
        this.showingInverse = !this.showingInverse;

        if (this.showingInverse) {
            if (this.cubeViews.length > 0) {
                const inverseScramble = this.cubeViews[0].invertMoves(this.scramble);
                this.inverseScrambleText.textContent = "Inverse: " + inverseScramble;
                this.inverseScrambleText.style.display = "block";
                this.inverseButton.textContent = "Hide inverse";
            }
        } else {
            this.inverseScrambleText.style.display = "none";
            this.inverseButton.textContent = "Show inverse";
        }
    }

    private addNewScrambleButton() {
        const newScrambleButton = document.createElement("button");
        newScrambleButton.classList.add("new-scramble-button");

        newScrambleButton.style.position = "absolute";
        newScrambleButton.style.top = "5px";
        newScrambleButton.style.left = "5px";

        this.loadSvg("/assets/restart.svg").then((svg) => {
            newScrambleButton.innerHTML = svg;
        }).catch((error) => {
            console.error("Failed to load SVG:", error);
            newScrambleButton.textContent = "⟳";
        });

        newScrambleButton.addEventListener("click", async () => {
            this.resetAllCubeViews();

            if (this.refreshScrambleCallback) {
                await this.refreshScrambleCallback();
            } else {
                const newScramble = (await randomScrambleForEvent("333fm")).toString();
                this.updateScramble(newScramble);
            }
        });

        this.scrambleContainer.appendChild(newScrambleButton);
    }

    private resetAllCubeViews() {
        this.cubeViews.forEach(cubeView => {
            const container = document.getElementById(cubeView.getContainerId());
            if (container) {
                container.remove();
            }
        });

        const allCubeContainers = document.querySelectorAll('.cube-container');
        allCubeContainers.forEach(container => {
            container.remove();
        });

        this.cubeViews = [];

        const links = document.querySelectorAll('.connection-line');
        links.forEach(link => link.remove());
    }

    updateScramble(newScramble: string) {
        this.scramble = newScramble;
        this.scrambleText.textContent = newScramble;
        saveState("scramble", newScramble);

        if (this.showingInverse) {
            if (this.cubeViews.length > 0) {
                const inverseScramble = this.cubeViews[0].invertMoves(newScramble);
                this.inverseScrambleText.textContent = "Inverse: " + inverseScramble;
            }
        }

        this.cubeViews.forEach((cubeView) => {
            if (cubeView) {
                cubeView.updateScramble(newScramble);
            }
        });
    }

    private async loadSvg(path: string): Promise<string> {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load SVG: ${path}`);
        }
        return await response.text();
    }

    registerCubeView(cubeView: CubeView) {
        if (!this.cubeViews.includes(cubeView)) {
            this.cubeViews.push(cubeView);
        }
    }

    onRefreshScramble(callback: () => Promise<void>) {
        this.refreshScrambleCallback = callback;
    }
}
