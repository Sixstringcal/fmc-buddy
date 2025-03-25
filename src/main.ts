import { randomScrambleForEvent } from "cubing/scramble";
import { CubeView } from "./CubeView";

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

const loadSvg = async (path: string): Promise<string> => {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to load SVG: ${path}`);
    }
    return await response.text();
};

const addCountdownTimer = async () => {
    const timerContainer = document.createElement("div");
    timerContainer.id = "countdown-timer";
    timerContainer.classList.add("countdown-timer");

    const timerDisplay = document.createElement("span");
    timerDisplay.id = "timer-display";
    timerContainer.appendChild(timerDisplay);

    const timerButton = document.createElement("button");
    timerButton.id = "timer-button";
    timerButton.classList.add("timer-button");
    timerButton.innerHTML = await loadSvg("/assets/play.svg");
    timerContainer.appendChild(timerButton);

    const restartButton = document.createElement("button");
    restartButton.id = "restart-button";
    restartButton.classList.add("timer-button");
    restartButton.style.display = "none";
    restartButton.innerHTML = await loadSvg("/assets/restart.svg");
    timerContainer.appendChild(restartButton);

    document.body.appendChild(timerContainer);

    let remainingTime = 60 * 60;
    let timerInterval: NodeJS.Timeout | null = null;
    let isRunning = false;

    const updateTimer = () => {
        restartButton.style.display = remainingTime < 60 * 60 ? "inline-block" : "none";

        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

        if (remainingTime > 0) {
            remainingTime--;
        } else {
            clearInterval(timerInterval!);
            timerInterval = null;
            isRunning = false;
            loadSvg("/assets/play.svg").then((svg) => {
                timerButton.innerHTML = svg;
            });
        }
    };

    timerButton.addEventListener("click", async () => {
        if (isRunning) {
            clearInterval(timerInterval!);
            timerInterval = null;
            isRunning = false;
            timerButton.innerHTML = await loadSvg("/assets/play.svg");
        } else {
            if (!timerInterval) {
                updateTimer();
                timerInterval = setInterval(updateTimer, 1000);
            }
            isRunning = true;
            timerButton.innerHTML = await loadSvg("/assets/pause.svg");
        }
    });

    restartButton.addEventListener("click", async () => {
        clearInterval(timerInterval!);
        timerInterval = null;
        isRunning = false;
        remainingTime = 60 * 60;
        updateTimer();
        timerButton.innerHTML = await loadSvg("/assets/play.svg");
    });

    updateTimer();
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

    await addCountdownTimer();

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
