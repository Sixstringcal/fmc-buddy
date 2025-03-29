export class Connection {
  private line: HTMLElement;
  private arrow: HTMLElement;
  private sourceId: string;
  private targetId: string;

  constructor(sourceId: string, targetId: string) {
    this.sourceId = sourceId;
    this.targetId = targetId;

    this.line = document.createElement("div");
    this.line.classList.add("connection-line");
    this.line.id = `connection-${this.sourceId}-${this.targetId}`;
    this.line.style.position = "absolute";
    this.line.style.zIndex = "0";
    this.line.style.pointerEvents = "none";
    this.line.style.backgroundColor = "#4CAF50";
    this.line.style.height = "2px";
    this.line.style.transformOrigin = "0 0";
    document.body.appendChild(this.line);

    this.arrow = document.createElement("div");
    this.arrow.classList.add("connection-arrow");
    this.arrow.id = `arrow-${this.sourceId}-${this.targetId}`;
    this.arrow.style.position = "absolute";
    this.arrow.style.zIndex = "0";
    this.arrow.style.pointerEvents = "none";
    this.arrow.style.width = "0";
    this.arrow.style.height = "0";
    this.arrow.style.borderTop = "5px solid transparent";
    this.arrow.style.borderBottom = "5px solid transparent";
    this.arrow.style.borderLeft = "8px solid #4CAF50";
    document.body.appendChild(this.arrow);

    this.updatePosition();
  }

  public updatePosition() {
    const sourceContainer = document.getElementById(this.sourceId);
    const targetContainer = document.getElementById(this.targetId);

    if (!sourceContainer || !targetContainer) {
      console.warn(
        `Cannot update connection: containers not found (${this.sourceId} -> ${this.targetId})`
      );
      return;
    }

    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    const sourceRect = sourceContainer.getBoundingClientRect();
    const targetRect = targetContainer.getBoundingClientRect();

    const sourceY = sourceRect.top + scrollY + sourceRect.height / 2;
    const targetY = targetRect.top + scrollY + targetRect.height / 2;

    const sourceX = sourceRect.right + scrollX;
    const targetX = targetRect.left + scrollX;

    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const length = Math.sqrt(dx * dx + dy * dy);

    this.line.style.width = `${length}px`;
    this.line.style.left = `${sourceX}px`;
    this.line.style.top = `${sourceY}px`;
    this.line.style.transform = `rotate(${angle}deg)`;

    const arrowX = targetX - 10;
    const arrowY = targetY - 5;

    this.arrow.style.left = `${arrowX}px`;
    this.arrow.style.top = `${arrowY}px`;
    this.arrow.style.transform = `rotate(${angle}deg)`;

    this.line.style.display = "block";
    this.arrow.style.display = "block";
  }

  public remove() {
    if (this.line && this.line.parentNode) {
      this.line.parentNode.removeChild(this.line);
    }
    if (this.arrow && this.arrow.parentNode) {
      this.arrow.parentNode.removeChild(this.arrow);
    }
  }

  public getSourceId(): string {
    return this.sourceId;
  }

  public getTargetId(): string {
    return this.targetId;
  }

  public setVisible(visible: boolean) {
    if (this.line) {
      this.line.style.display = visible ? "block" : "none";
      this.line.style.opacity = visible ? "1" : "0";
    }
    if (this.arrow) {
      this.arrow.style.display = visible ? "block" : "none";
      this.arrow.style.opacity = visible ? "1" : "0";
    }
  }
}
