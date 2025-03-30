import { loadState, saveState } from "./stateManager";

export interface CubeSettings {
    colors: {
        U: string;
        F: string;
        R: string;
        L: string;
        D: string;
        B: string;
    };
    cubeScale: number;
    textSize: number;
    showScrambleInverse: boolean;
    highlightPhases: boolean;
}

export const defaultSettings: CubeSettings = {
    colors: {
        U: "#FFFFFF",
        F: "#00FF00",
        R: "#FF0000",
        L: "#FFA500",
        D: "#FFFF00",
        B: "#0000FF",
    },
    cubeScale: 1.0,
    textSize: 16,
    showScrambleInverse: true,
    highlightPhases: true,
};

export class SettingsModal {
    private modalElement: HTMLDivElement;
    private settings: CubeSettings;
    private onSettingsChange: (settings: CubeSettings) => void;
    
    constructor(onSettingsChange: (settings: CubeSettings) => void) {
        this.onSettingsChange = onSettingsChange;
        this.settings = loadState<CubeSettings>("cubeSettings", defaultSettings);
        this.modalElement = this.createModal();
        document.body.appendChild(this.modalElement);
    }
    
    private createModal(): HTMLDivElement {
        const modal = document.createElement("div");
        modal.className = "settings-modal";
        modal.style.display = "none";
        
        const modalContent = document.createElement("div");
        modalContent.className = "settings-modal-content";
        
        const closeButton = document.createElement("span");
        closeButton.className = "settings-close-button";
        closeButton.innerHTML = "&times;";
        closeButton.onclick = () => this.hide();
        modalContent.appendChild(closeButton);
        
        const title = document.createElement("h2");
        title.textContent = "Cube Settings";
        modalContent.appendChild(title);
        
        const colorSection = this.createColorSettings();
        modalContent.appendChild(colorSection);
        
        const scaleSection = this.createScaleSettings();
        modalContent.appendChild(scaleSection);
        
        const textSizeSection = this.createTextSizeSettings();
        modalContent.appendChild(textSizeSection);
        
        const highlightSection = this.createHighlightSettings();
        modalContent.appendChild(highlightSection);
        
        const showScrambleInverseSection = this.createShowScrambleInverseSettings();
        modalContent.appendChild(showScrambleInverseSection);
        
        modal.appendChild(modalContent);
        
        modal.onclick = (event) => {
            if (event.target === modal) {
                this.hide();
            }
        };
        
        return modal;
    }
    
    private createColorSettings(): HTMLDivElement {
        const section = document.createElement("div");
        section.className = "settings-section";
        
        const sectionTitle = document.createElement("h3");
        sectionTitle.textContent = "Cube Colors";
        section.appendChild(sectionTitle);
        
        const faces = ['U', 'F', 'R', 'L', 'D', 'B'];
        const faceNames = ['Up', 'Front', 'Right', 'Left', 'Down', 'Back'];
        
        faces.forEach((face, index) => {
            const container = document.createElement("div");
            container.className = "color-setting";
            
            const label = document.createElement("label");
            label.textContent = `${faceNames[index]} (${face}): `;
            container.appendChild(label);
            
            const colorPicker = document.createElement("input");
            colorPicker.type = "color";
            colorPicker.value = this.settings.colors[face as keyof typeof this.settings.colors];
            colorPicker.addEventListener("input", (e) => {
                const target = e.target as HTMLInputElement;
                this.settings.colors[face as keyof typeof this.settings.colors] = target.value;
                this.saveAndApplySettings();
            });
            
            container.appendChild(colorPicker);
            section.appendChild(container);
        });
        
        return section;
    }
    
    private createScaleSettings(): HTMLDivElement {
        const section = document.createElement("div");
        section.className = "settings-section";
        
        const sectionTitle = document.createElement("h3");
        sectionTitle.textContent = "Cube Scale";
        section.appendChild(sectionTitle);
        
        const container = document.createElement("div");
        container.className = "slider-setting";
        
        const valueDisplay = document.createElement("span");
        valueDisplay.textContent = this.settings.cubeScale.toFixed(1);
        valueDisplay.className = "slider-value";
        
        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = "0.5";
        slider.max = "2";
        slider.step = "0.1";
        slider.value = this.settings.cubeScale.toString();
        slider.addEventListener("input", (e) => {
            const target = e.target as HTMLInputElement;
            this.settings.cubeScale = parseFloat(target.value);
            valueDisplay.textContent = this.settings.cubeScale.toFixed(1);
            this.saveAndApplySettings();
        });
        
        container.appendChild(slider);
        container.appendChild(valueDisplay);
        section.appendChild(container);
        
        return section;
    }
    
    private createTextSizeSettings(): HTMLDivElement {
        const section = document.createElement("div");
        section.className = "settings-section";
        
        const sectionTitle = document.createElement("h3");
        sectionTitle.textContent = "Text Size";
        section.appendChild(sectionTitle);
        
        const container = document.createElement("div");
        container.className = "slider-setting";
        
        const valueDisplay = document.createElement("span");
        valueDisplay.textContent = `${this.settings.textSize}px`;
        valueDisplay.className = "slider-value";
        
        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = "10";
        slider.max = "24";
        slider.step = "1";
        slider.value = this.settings.textSize.toString();
        slider.addEventListener("input", (e) => {
            const target = e.target as HTMLInputElement;
            this.settings.textSize = parseInt(target.value);
            valueDisplay.textContent = `${this.settings.textSize}px`;
            this.saveAndApplySettings();
        });
        
        container.appendChild(slider);
        container.appendChild(valueDisplay);
        section.appendChild(container);
        
        return section;
    }
    
    private createHighlightSettings(): HTMLDivElement {
        const section = document.createElement("div");
        section.className = "settings-section";
        
        const container = document.createElement("div");
        container.className = "checkbox-setting";
        
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = "highlight-phases-checkbox";
        checkbox.checked = this.settings.highlightPhases;
        checkbox.addEventListener("change", (e) => {
            const target = e.target as HTMLInputElement;
            this.settings.highlightPhases = target.checked;
            this.saveAndApplySettings();
        });
        
        const label = document.createElement("label");
        label.htmlFor = "highlight-phases-checkbox";
        label.textContent = "Highlight Phase Pieces";
        
        container.appendChild(checkbox);
        container.appendChild(label);
        section.appendChild(container);
        
        return section;
    }
    
    private createShowScrambleInverseSettings(): HTMLDivElement {
        const section = document.createElement("div");
        section.className = "settings-section";
        
        const container = document.createElement("div");
        container.className = "checkbox-setting";
        
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = "show-scramble-inverse-checkbox";
        checkbox.checked = this.settings.showScrambleInverse;
        checkbox.addEventListener("change", (e) => {
            const target = e.target as HTMLInputElement;
            this.settings.showScrambleInverse = target.checked;
            this.saveAndApplySettings();
        });
        
        const label = document.createElement("label");
        label.htmlFor = "show-scramble-inverse-checkbox";
        label.textContent = "Show Inverse Scramble";
        
        container.appendChild(checkbox);
        container.appendChild(label);
        section.appendChild(container);
        
        return section;
    }
    
    private saveAndApplySettings(): void {
        saveState("cubeSettings", this.settings);
        this.onSettingsChange(this.settings);
    }
    
    public show(): void {
        this.modalElement.style.display = "block";
        const settingsButton = document.getElementById("settings-button");
        if (settingsButton) {
            settingsButton.style.display = "none";
        }
    }
    
    public hide(): void {
        this.modalElement.style.display = "none";
        const settingsButton = document.getElementById("settings-button");
        if (settingsButton) {
            settingsButton.style.display = "flex";
        }
    }
    
    public getSettings(): CubeSettings {
        return {...this.settings};
    }
}
