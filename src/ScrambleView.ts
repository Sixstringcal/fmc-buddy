import { saveState } from "./stateManager";
import { randomScrambleForEvent } from "cubing/scramble";
import { CubeView } from "./CubeView";

export class ScrambleView {
    private scramble: string;
    private scrambleContainer: HTMLElement;
    private scrambleText: HTMLElement;
    private cubeViews: CubeView[] = [];

    constructor(scramble: string) {
        this.scramble = scramble;
        this.scrambleContainer = document.createElement("div");
        this.scrambleText = document.createElement("div");
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
            const newScramble = (await randomScrambleForEvent("333fm")).toString();
            this.updateScramble(newScramble);
        });

        this.scrambleContainer.appendChild(newScrambleButton);
    }

    updateScramble(newScramble: string) {
        this.scramble = newScramble;
        this.scrambleText.textContent = newScramble;
        saveState("scramble", newScramble);

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
}
