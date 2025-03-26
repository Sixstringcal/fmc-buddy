export class Timer {
    private timerContainer: HTMLElement;
    private timerDisplay: HTMLElement;
    private timerButton: HTMLButtonElement;
    private restartButton: HTMLButtonElement;
    private remainingTime: number;
    private timerInterval: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;

    constructor(private duration: number, private onComplete?: () => void) {
        this.remainingTime = duration;

        this.timerContainer = document.createElement("div");
        this.timerContainer.id = "countdown-timer";
        this.timerContainer.classList.add("countdown-timer");

        this.timerDisplay = document.createElement("span");
        this.timerDisplay.id = "timer-display";
        this.timerContainer.appendChild(this.timerDisplay);

        this.timerButton = document.createElement("button");
        this.timerButton.id = "timer-button";
        this.timerButton.classList.add("timer-button");
        this.timerContainer.appendChild(this.timerButton);

        this.restartButton = document.createElement("button");
        this.restartButton.id = "restart-button";
        this.restartButton.classList.add("timer-button");
        this.restartButton.style.display = "none";
        this.timerContainer.appendChild(this.restartButton);

        document.body.appendChild(this.timerContainer);

        this.initialize();

        this.positionTimerBelowScramble();

        window.addEventListener('resize', () => {
            this.positionTimerBelowScramble();
        });
    }

    private async initialize() {
        this.timerButton.innerHTML = await this.loadSvg("/assets/play.svg");
        this.restartButton.innerHTML = await this.loadSvg("/assets/restart.svg");

        this.timerButton.addEventListener("click", () => this.toggleTimer());
        this.restartButton.addEventListener("click", () => this.resetTimer());

        this.updateTimerDisplay();
    }

    private async loadSvg(path: string): Promise<string> {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load SVG: ${path}`);
        }
        return await response.text();
    }

    private updateTimerDisplay() {
        const minutes = Math.floor(this.remainingTime / 60);
        const seconds = this.remainingTime % 60;
        this.timerDisplay.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

        this.restartButton.style.display = this.remainingTime < this.duration ? "inline-block" : "none";

        if (this.remainingTime === 0 && this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
            this.isRunning = false;
            this.loadSvg("/assets/play.svg").then((svg) => {
                this.timerButton.innerHTML = svg;
            });
            if (this.onComplete) {
                this.onComplete();
            }
        }
    }

    private toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    private startTimer() {
        if (!this.timerInterval) {
            this.timerInterval = setInterval(() => {
                if (this.remainingTime > 0) {
                    this.remainingTime--;
                    this.updateTimerDisplay();
                }
            }, 1000);
        }
        this.isRunning = true;
        this.loadSvg("/assets/pause.svg").then((svg) => {
            this.timerButton.innerHTML = svg;
        });
    }

    private pauseTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.isRunning = false;
        this.loadSvg("/assets/play.svg").then((svg) => {
            this.timerButton.innerHTML = svg;
        });
    }

    private resetTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.isRunning = false;
        this.remainingTime = this.duration;
        this.updateTimerDisplay();
        this.loadSvg("/assets/play.svg").then((svg) => {
            this.timerButton.innerHTML = svg;
        });
    }

    private positionTimerBelowScramble() {
        const scrambleContainer = document.getElementById('scramble-container');

        if (scrambleContainer) {
            const scrambleRect = scrambleContainer.getBoundingClientRect();
            const timerRect = this.timerContainer.getBoundingClientRect();

            const overlapping = !(
                timerRect.top > scrambleRect.bottom ||
                timerRect.right < scrambleRect.left ||
                timerRect.bottom < scrambleRect.top ||
                timerRect.left > scrambleRect.right
            );

            if (overlapping) {
                const marginTop = scrambleRect.height + 10;
                this.timerContainer.style.marginTop = `${marginTop}px`;
            } else {
                this.timerContainer.style.marginTop = '0px';
            }
        }
    }
}
