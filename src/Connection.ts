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

    const sourceSides = [
      {
        x: sourceRect.left + scrollX,
        y: sourceRect.top + scrollY + sourceRect.height / 2,
      },
      {
        x: sourceRect.right + scrollX,
        y: sourceRect.top + scrollY + sourceRect.height / 2,
      },
      {
        x: sourceRect.left + scrollX + sourceRect.width / 2,
        y: sourceRect.top + scrollY,
      },
      {
        x: sourceRect.left + scrollX + sourceRect.width / 2,
        y: sourceRect.bottom + scrollY,
      },
    ];

    const targetSides = [
      {
        x: targetRect.left + scrollX,
        y: targetRect.top + scrollY + targetRect.height / 2,
      },
      {
        x: targetRect.right + scrollX,
        y: targetRect.top + scrollY + targetRect.height / 2,
      },
      {
        x: targetRect.left + scrollX + targetRect.width / 2,
        y: targetRect.top + scrollY,
      },
      {
        x: targetRect.left + scrollX + targetRect.width / 2,
        y: targetRect.bottom + scrollY,
      },
    ];

    let minDistance = Infinity;
    let closestSourceSide = sourceSides[0];
    let closestTargetSide = targetSides[0];

    sourceSides.forEach((sourceSide) => {
      targetSides.forEach((targetSide) => {
        const dx = targetSide.x - sourceSide.x;
        const dy = targetSide.y - sourceSide.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
          minDistance = distance;
          closestSourceSide = sourceSide;
          closestTargetSide = targetSide;
        }
      });
    });

    const dx = closestTargetSide.x - closestSourceSide.x;
    const dy = closestTargetSide.y - closestSourceSide.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const length = Math.sqrt(dx * dx + dy * dy);

    this.line.style.width = `${length}px`;
    this.line.style.left = `${closestSourceSide.x}px`;
    this.line.style.top = `${closestSourceSide.y}px`;
    this.line.style.transform = `rotate(${angle}deg)`;

    const arrowX = closestTargetSide.x - 10 * Math.cos((angle * Math.PI) / 180);
    const arrowY = closestTargetSide.y - 10 * Math.sin((angle * Math.PI) / 180);

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
