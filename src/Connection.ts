/**
 * Connection class to manage visual connections between CubeViews
 */
export class Connection {
    private line: HTMLElement;
    private sourceId: string;
    private targetId: string;
    
    constructor(sourceId: string, targetId: string) {
        this.sourceId = sourceId;
        this.targetId = targetId;
        this.createLine();
    }
    
    /**
     * Create and style the connection line element
     */
    private createLine() {
        // Create line element
        this.line = document.createElement("div");
        this.line.classList.add("connection-line");
        this.line.id = `connection-${this.sourceId}-${this.targetId}`;
        
        // Store container IDs as data attributes for later updates
        this.line.setAttribute('data-source', this.sourceId);
        this.line.setAttribute('data-target', this.targetId);
        
        document.body.appendChild(this.line);
        
        // Style the line
        this.line.style.position = "absolute";
        this.line.style.height = "2px";
        this.line.style.backgroundColor = "#4CAF50";
        this.line.style.zIndex = "1";
        
        // Add a subtle transition for smooth updates when dragging
        this.line.style.transition = "all 0.05s ease-out";
        
        // Initial positioning
        this.updatePosition();
        
        // Update position when window is resized
        window.addEventListener("resize", () => this.updatePosition());
    }
    
    /**
     * Update the line position based on the current positions of the connected elements
     */
    public updatePosition() {
        const sourceContainer = document.getElementById(this.sourceId);
        const targetContainer = document.getElementById(this.targetId);
        
        if (!sourceContainer || !targetContainer) return;
        
        const sourceRect = sourceContainer.getBoundingClientRect();
        const targetRect = targetContainer.getBoundingClientRect();
        
        // Position at the middle height of containers
        const sourceY = sourceRect.top + sourceRect.height / 2;
        const targetY = targetRect.top + targetRect.height / 2;
        
        // Connect from right side of source to left side of target
        const sourceX = sourceRect.right;
        const targetX = targetRect.left;
        
        // Calculate the angle and length for the diagonal line
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        // Position and size the line
        this.line.style.width = `${length}px`;
        this.line.style.left = `${sourceX}px`;
        this.line.style.top = `${sourceY}px`;
        this.line.style.transformOrigin = '0 0'; // Set transform origin to the left side
        this.line.style.transform = `rotate(${angle}deg)`; // Rotate the line to correct angle
    }
    
    /**
     * Remove the line element from the DOM
     */
    public remove() {
        if (this.line && this.line.parentNode) {
            this.line.parentNode.removeChild(this.line);
        }
    }
    
    /**
     * Get the line HTML element
     */
    public getElement(): HTMLElement {
        return this.line;
    }
    
    /**
     * Get the source container ID
     */
    public getSourceId(): string {
        return this.sourceId;
    }
    
    /**
     * Get the target container ID
     */
    public getTargetId(): string {
        return this.targetId;
    }
}
