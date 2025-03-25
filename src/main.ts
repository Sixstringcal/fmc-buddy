import { randomScrambleForEvent } from "cubing/scramble";
import { CubeView } from "./CubeView";
import { Timer } from "./Timer";

let scramble: string = "";
let cubeViewCount = 0;
const cubeViews: CubeView[] = [];
const EDIT_ICON: string = "✏️";
const CONFIRM_ICON: string = "✔️";

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

const addEditButton = (scrambleText: HTMLElement, scrambleContainer: HTMLElement) => {
    const editButton = document.createElement("button");
    editButton.innerHTML = EDIT_ICON;
    editButton.classList.add("edit-button");

    let isEditing = false;

    const toggleEdit = () => {
        if (isEditing) {
            const input = scrambleContainer.querySelector("input") as HTMLInputElement;
            if (input) {
                scrambleText.textContent = input.value;
                scramble = input.value;
                cubeViews.forEach((cubeView) => cubeView.updateScramble(scramble));
                input.remove();
            }
            editButton.textContent = EDIT_ICON;
        } else {
            const input = document.createElement("input");
            input.type = "text";
            input.value = scrambleText.textContent || "";
            input.classList.add("scramble-input");
            scrambleContainer.insertBefore(input, scrambleText);
            scrambleText.textContent = "";
            input.select();
            input.addEventListener("keydown", (event) => {
                if (event.key === "Enter") {
                    toggleEdit();
                }
            });
            editButton.textContent = CONFIRM_ICON;
        }
        isEditing = !isEditing;
    };

    editButton.addEventListener("click", toggleEdit);
    scrambleContainer.appendChild(editButton);
};

(async () => {
    addLoadingSpinner();

    scramble = (await randomScrambleForEvent("333fm")).toString();

    const scrambleContainer = document.createElement("div");
    scrambleContainer.id = "scramble-container";
    scrambleContainer.classList.add("scramble-container");
    scrambleContainer.style.position = "absolute";
    scrambleContainer.style.top = "0";
    scrambleContainer.style.left = "0";

    const scrambleLabel = document.createElement("div");
    scrambleLabel.textContent = "Scramble:";
    scrambleLabel.classList.add("scramble-label");
    scrambleContainer.appendChild(scrambleLabel);

    const scrambleText = document.createElement("div");
    scrambleText.id = "scramble-text";
    scrambleText.textContent = scramble;
    scrambleContainer.appendChild(scrambleText);

    addEditButton(scrambleText, scrambleContainer);

    document.body.insertBefore(scrambleContainer, document.body.firstChild);

    const timer = new Timer(60 * 60, () => {
        console.log("Timer completed!");
    });

    removeLoadingSpinner();

    const addButton = document.createElement("button");
    addButton.textContent = "+";
    addButton.classList.add("add-button");
    addButton.addEventListener("click", () => {
        cubeViewCount++;
        const cubeView = new CubeView(scramble, `cube-container-${cubeViewCount}`);
        cubeView.initialize();
        cubeViews.push(cubeView);
    });
    document.body.appendChild(addButton);

    cubeViewCount++;
    const cubeView = new CubeView(scramble, `cube-container-${cubeViewCount}`);
    cubeView.initialize();
    cubeViews.push(cubeView);
})();

export { };
