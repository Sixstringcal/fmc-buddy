export class Connection {
  private sourceId: string;
  private targetId: string;
  private pathSegments: HTMLElement[] = [];
  private arrows: HTMLElement[] = [];
  private currentPath: { x: number; y: number; edge?: string }[] = [];
  
  private static allConnections: Connection[] = [];

  constructor(sourceId: string, targetId: string) {
    this.sourceId = sourceId;
    this.targetId = targetId;
    
    Connection.allConnections.push(this);
    
    this.updatePosition();
  }

  public static getAllConnections(): Connection[] {
    return Connection.allConnections;
  }

  public static updateConnectionsIntersectingCubeView(cubeViewId: string): void {
    const cubeViewElement = document.getElementById(cubeViewId);
    if (!cubeViewElement) return;

    const cubeViewRect = cubeViewElement.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    const absoluteRect = new DOMRect(
      cubeViewRect.left + scrollX,
      cubeViewRect.top + scrollY,
      cubeViewRect.width,
      cubeViewRect.height
    );

    Connection.allConnections.forEach(connection => {
      if (connection.sourceId === cubeViewId || connection.targetId === cubeViewId) {
        return;
      }
      
      if (connection.intersectsCubeView(absoluteRect)) {
        connection.updatePosition();
      }
    });
  }
  
  private intersectsCubeView(cubeViewRect: DOMRect): boolean {
    if (!this.currentPath || this.currentPath.length < 2) return false;
    
    for (let i = 0; i < this.currentPath.length - 1; i++) {
      const p1 = this.currentPath[i];
      const p2 = this.currentPath[i + 1];
      
      if (this.lineIntersectsRect(p1.x, p1.y, p2.x, p2.y, cubeViewRect)) {
        return true;
      }
    }
    
    return false;
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

    this.clearPathSegments();

    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    const sourceRect = sourceContainer.getBoundingClientRect();
    const targetRect = targetContainer.getBoundingClientRect();

    const sourceSides = [
      {
        x: sourceRect.left + scrollX,
        y: sourceRect.top + scrollY + sourceRect.height / 2,
        edge: 'left'
      },
      {
        x: sourceRect.right + scrollX,
        y: sourceRect.top + scrollY + sourceRect.height / 2,
        edge: 'right'
      },
      {
        x: sourceRect.left + scrollX + sourceRect.width / 2,
        y: sourceRect.top + scrollY,
        edge: 'top'
      },
      {
        x: sourceRect.left + scrollX + sourceRect.width / 2,
        y: sourceRect.bottom + scrollY,
        edge: 'bottom'
      },
    ];

    const targetSides = [
      {
        x: targetRect.left + scrollX,
        y: targetRect.top + scrollY + targetRect.height / 2,
        edge: 'left'
      },
      {
        x: targetRect.right + scrollX,
        y: targetRect.top + scrollY + targetRect.height / 2,
        edge: 'right'
      },
      {
        x: targetRect.left + scrollX + targetRect.width / 2,
        y: targetRect.top + scrollY,
        edge: 'top'
      },
      {
        x: targetRect.left + scrollX + targetRect.width / 2,
        y: targetRect.bottom + scrollY,
        edge: 'bottom'
      },
    ];

    let minDistance = Infinity;
    let bestSourceSide = sourceSides[0];
    let bestTargetSide = targetSides[0];

    sourceSides.forEach((sourceSide) => {
      targetSides.forEach((targetSide) => {
        const dx = targetSide.x - sourceSide.x;
        const dy = targetSide.y - sourceSide.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
          minDistance = distance;
          bestSourceSide = sourceSide;
          bestTargetSide = targetSide;
        }
      });
    });

    const obstacles = this.getObstacles();

    const path = this.findOptimalPath(bestSourceSide, bestTargetSide, obstacles, sourceRect, targetRect);

    this.currentPath = path;

    for (let i = 0; i < path.length - 1; i++) {
      this.createPathSegment(path[i], path[i + 1], i === path.length - 2);
    }
  }

  private getObstacles() {
    const obstacles: DOMRect[] = [];
    const containers = document.querySelectorAll('.cube-container');

    containers.forEach((container) => {
      if (container.id !== this.sourceId && container.id !== this.targetId) {
        const rect = container.getBoundingClientRect();
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;

        const padding = 5;
        obstacles.push(new DOMRect(
          rect.left + scrollX - padding,
          rect.top + scrollY - padding,
          rect.width + padding * 2,
          rect.height + padding * 2
        ));
      }
    });

    return obstacles;
  }

  private findOptimalPath(
    start: { x: number; y: number; edge: string },
    end: { x: number; y: number; edge: string },
    obstacles: DOMRect[],
    sourceRect: DOMRect,
    targetRect: DOMRect
  ) {
    if (!this.pathIntersectsObstacle(start, end, obstacles)) {
      return [start, end];
    }

    const candidatePaths = [];

    const lPath1 = [
      start,
      { x: end.x, y: start.y, edge: 'corner' },
      end
    ];

    const lPath2 = [
      start,
      { x: start.x, y: end.y, edge: 'corner' },
      end
    ];

    if (!this.pathHasObstacles(lPath1, obstacles)) {
      candidatePaths.push(lPath1);
    }

    if (!this.pathHasObstacles(lPath2, obstacles)) {
      candidatePaths.push(lPath2);
    }

    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    const zPath1 = [
      start,
      { x: midX, y: start.y, edge: 'mid' },
      { x: midX, y: end.y, edge: 'mid' },
      end
    ];

    const zPath2 = [
      start,
      { x: start.x, y: midY, edge: 'mid' },
      { x: end.x, y: midY, edge: 'mid' },
      end
    ];

    if (!this.pathHasObstacles(zPath1, obstacles)) {
      candidatePaths.push(zPath1);
    }

    if (!this.pathHasObstacles(zPath2, obstacles)) {
      candidatePaths.push(zPath2);
    }

    const spacing = 30;

    const waypoints = this.generateExtendedWaypoints(sourceRect, targetRect, obstacles, spacing);

    const visibilityPaths = this.findVisibilityGraphPaths(start, end, waypoints, obstacles);
    candidatePaths.push(...visibilityPaths);

    const sourceAdjustedRect = new DOMRect(
      sourceRect.left + (window.pageXOffset || document.documentElement.scrollLeft),
      sourceRect.top + (window.pageYOffset || document.documentElement.scrollTop),
      sourceRect.width,
      sourceRect.height
    );

    const targetAdjustedRect = new DOMRect(
      targetRect.left + (window.pageXOffset || document.documentElement.scrollLeft),
      targetRect.top + (window.pageYOffset || document.documentElement.scrollTop),
      targetRect.width,
      targetRect.height
    );

    for (const offset of [50, 75, 100]) {
      const cornerPaths = this.generateCornerPaths(
        start, end, sourceAdjustedRect, targetAdjustedRect, offset
      );

      for (const path of cornerPaths) {
        if (!this.pathHasObstacles(path, obstacles)) {
          candidatePaths.push(path);
        }
      }
    }

    if (candidatePaths.length === 0) {
      return this.findPathWithIntermediatePoints(
        start, end, obstacles, sourceAdjustedRect, targetAdjustedRect
      );
    }

    return this.chooseBestPath(candidatePaths);
  }

  private findPathWithIntermediatePoints(
    start: { x: number; y: number; edge: string },
    end: { x: number; y: number; edge: string },
    obstacles: DOMRect[],
    sourceRect: DOMRect,
    targetRect: DOMRect
  ) {
    const spacing = 30;
    const sourcePoints = this.generateWaypoints(sourceRect, spacing, start.edge);
    const targetPoints = this.generateWaypoints(targetRect, spacing, end.edge);

    let bestPath: { x: number; y: number; edge?: string }[] = [start, end];
    let bestPathLength = Infinity;

    for (const sourcePoint of sourcePoints) {
      for (const targetPoint of targetPoints) {
        if (!this.pathIntersectsObstacle(start, sourcePoint, obstacles) &&
            !this.pathIntersectsObstacle(sourcePoint, targetPoint, obstacles) &&
            !this.pathIntersectsObstacle(targetPoint, end, obstacles)) {
          
          const pathLength = this.calculatePathLength([start, sourcePoint, targetPoint, end]);
          
          if (pathLength < bestPathLength) {
            bestPathLength = pathLength;
            bestPath = [start, sourcePoint, targetPoint, end];
          }
        }
      }
    }

    if (bestPath.length === 2 && this.pathIntersectsObstacle(start, end, obstacles)) {
      const intermediatePoint = { 
        x: start.x, 
        y: end.y,
        edge: start.edge
      };
      
      if (!this.pathIntersectsObstacle(start, intermediatePoint, obstacles) &&
          !this.pathIntersectsObstacle(intermediatePoint, end, obstacles)) {
        return [start, intermediatePoint, end];
      }
      
      const intermediatePoint2 = { 
        x: end.x, 
        y: start.y,
        edge: end.edge
      };
      
      if (!this.pathIntersectsObstacle(start, intermediatePoint2, obstacles) &&
          !this.pathIntersectsObstacle(intermediatePoint2, end, obstacles)) {
        return [start, intermediatePoint2, end];
      }
      
      const xMid = (start.x + end.x) / 2;
      const yMid = (start.y + end.y) / 2;
      
      const midPoint1 = { x: xMid, y: start.y, edge: 'mid' };
      const midPoint2 = { x: xMid, y: end.y, edge: 'mid' };
      
      if (!this.pathIntersectsObstacle(start, midPoint1, obstacles) &&
          !this.pathIntersectsObstacle(midPoint1, midPoint2, obstacles) &&
          !this.pathIntersectsObstacle(midPoint2, end, obstacles)) {
        return [start, midPoint1, midPoint2, end];
      }
      
      const midPoint3 = { x: start.x, y: yMid, edge: 'mid' };
      const midPoint4 = { x: end.x, y: yMid, edge: 'mid' };
      
      if (!this.pathIntersectsObstacle(start, midPoint3, obstacles) &&
          !this.pathIntersectsObstacle(midPoint3, midPoint4, obstacles) &&
          !this.pathIntersectsObstacle(midPoint4, end, obstacles)) {
        return [start, midPoint3, midPoint4, end];
      }
    }

    return bestPath;
  }

  private generateWaypoints(rect: DOMRect, spacing: number, excludeEdge?: string) {
    const waypoints: { x: number; y: number; edge: string }[] = [];
    
    if (excludeEdge !== 'top') {
      waypoints.push({ x: rect.left - spacing, y: rect.top - spacing, edge: 'top' });
      waypoints.push({ x: rect.left + rect.width / 2, y: rect.top - spacing, edge: 'top' });
      waypoints.push({ x: rect.right + spacing, y: rect.top - spacing, edge: 'top' });
    }
    
    if (excludeEdge !== 'right') {
      waypoints.push({ x: rect.right + spacing, y: rect.top - spacing, edge: 'right' });
      waypoints.push({ x: rect.right + spacing, y: rect.top + rect.height / 2, edge: 'right' });
      waypoints.push({ x: rect.right + spacing, y: rect.bottom + spacing, edge: 'right' });
    }
    
    if (excludeEdge !== 'bottom') {
      waypoints.push({ x: rect.right + spacing, y: rect.bottom + spacing, edge: 'bottom' });
      waypoints.push({ x: rect.left + rect.width / 2, y: rect.bottom + spacing, edge: 'bottom' });
      waypoints.push({ x: rect.left - spacing, y: rect.bottom + spacing, edge: 'bottom' });
    }
    
    if (excludeEdge !== 'left') {
      waypoints.push({ x: rect.left - spacing, y: rect.bottom + spacing, edge: 'left' });
      waypoints.push({ x: rect.left - spacing, y: rect.top + rect.height / 2, edge: 'left' });
      waypoints.push({ x: rect.left - spacing, y: rect.top - spacing, edge: 'left' });
    }
    
    return waypoints;
  }

  private pathHasObstacles(
    path: { x: number; y: number; edge?: string }[],
    obstacles: DOMRect[]
  ): boolean {
    for (let i = 0; i < path.length - 1; i++) {
      if (this.pathIntersectsObstacle(path[i], path[i + 1], obstacles)) {
        return true;
      }
    }
    return false;
  }

  private chooseBestPath(candidatePaths: { x: number; y: number; edge?: string }[][]) {
    if (candidatePaths.length === 0) {
      return [];
    }
    
    const scoredPaths = candidatePaths.map(path => {
      const length = this.calculatePathLength(path);
      const segmentCount = path.length - 1;
      
      const score = length * (1 + (segmentCount - 1) * 0.2);
      
      return { path, score };
    });
    
    scoredPaths.sort((a, b) => a.score - b.score);
    
    return scoredPaths[0].path;
  }

  private pathIntersectsObstacle(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    obstacles: DOMRect[]
  ): boolean {
    for (const obstacle of obstacles) {
      if (this.lineIntersectsRect(p1.x, p1.y, p2.x, p2.y, obstacle)) {
        return true;
      }
    }
    return false;
  }

  private lineIntersectsRect(x1: number, y1: number, x2: number, y2: number, rect: DOMRect): boolean {
    if ((x1 >= rect.left && x1 <= rect.right && y1 >= rect.top && y1 <= rect.bottom) ||
        (x2 >= rect.left && x2 <= rect.right && y2 >= rect.top && y2 <= rect.bottom)) {
      return true;
    }
    
    const lines = [
      { x1: rect.left, y1: rect.top, x2: rect.right, y2: rect.top },
      { x1: rect.right, y1: rect.top, x2: rect.right, y2: rect.bottom },
      { x1: rect.left, y1: rect.bottom, x2: rect.right, y2: rect.bottom },
      { x1: rect.left, y1: rect.top, x2: rect.left, y2: rect.bottom }
    ];
    
    for (const line of lines) {
      if (this.lineIntersectsLine(
        x1, y1, x2, y2,
        line.x1, line.y1, line.x2, line.y2
      )) {
        return true;
      }
    }
    
    return false;
  }

  private lineIntersectsLine(
    a1: number, b1: number, a2: number, b2: number,
    c1: number, d1: number, c2: number, d2: number
  ): boolean {
    const r = (a2 - a1) * (d1 - b1) - (b2 - b1) * (c1 - a1);
    const s = (a2 - a1) * (d2 - b1) - (b2 - b1) * (c2 - a1);
    
    const t = (c2 - c1) * (b1 - d1) - (d2 - d1) * (a1 - c1);
    const u = (c2 - c1) * (b2 - d1) - (d2 - d1) * (a2 - c1);
    
    if (r * s <= 0 && t * u <= 0) {
      return true;
    }
    
    return false;
  }

  private calculateDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculatePathLength(path: { x: number; y: number }[]): number {
    let length = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const dx = path[i + 1].x - path[i].x;
      const dy = path[i + 1].y - path[i].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }

  private createPathSegment(
    start: { x: number; y: number },
    end: { x: number; y: number },
    isLastSegment: boolean
  ) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    const segment = document.createElement("div");
    segment.classList.add("connection-line");
    segment.id = `segment-${this.sourceId}-${this.targetId}-${this.pathSegments.length}`;
    segment.style.width = `${length}px`;
    segment.style.left = `${start.x}px`;
    segment.style.top = `${start.y}px`;
    segment.style.transform = `rotate(${angle}deg)`;
    document.body.appendChild(segment);
    this.pathSegments.push(segment);

    if (isLastSegment) {
      const arrowX = end.x - 10 * Math.cos((angle * Math.PI) / 180);
      const arrowY = end.y - 10 * Math.sin((angle * Math.PI) / 180);

      const arrow = document.createElement("div");
      arrow.classList.add("connection-arrow");
      arrow.id = `arrow-${this.sourceId}-${this.targetId}`;
      arrow.style.left = `${arrowX}px`;
      arrow.style.top = `${arrowY}px`;
      arrow.style.transform = `rotate(${angle}deg)`;
      document.body.appendChild(arrow);
      this.arrows.push(arrow);
    }
  }

  private clearPathSegments() {
    this.pathSegments.forEach(segment => {
      if (segment && segment.parentNode) {
        segment.parentNode.removeChild(segment);
      }
    });
    this.pathSegments = [];

    this.arrows.forEach(arrow => {
      if (arrow && arrow.parentNode) {
        arrow.parentNode.removeChild(arrow);
      }
    });
    this.arrows = [];
  }

  public remove() {
    this.clearPathSegments();
    
    const index = Connection.allConnections.indexOf(this);
    if (index !== -1) {
      Connection.allConnections.splice(index, 1);
    }
  }

  public getSourceId(): string {
    return this.sourceId;
  }

  public getTargetId(): string {
    return this.targetId;
  }

  public setVisible(visible: boolean) {
    this.pathSegments.forEach(segment => {
      if (segment) {
        segment.style.display = visible ? "block" : "none";
        segment.style.opacity = visible ? "1" : "0";
      }
    });

    this.arrows.forEach(arrow => {
      if (arrow) {
        arrow.style.display = visible ? "block" : "none";
        arrow.style.opacity = visible ? "1" : "0";
      }
    });
  }

  private generateExtendedWaypoints(
    sourceRect: DOMRect, 
    targetRect: DOMRect, 
    obstacles: DOMRect[],
    spacing: number
  ) {
    const waypoints: { x: number; y: number; edge: string }[] = [];
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    const rects = [
      new DOMRect(
        sourceRect.left + scrollX,
        sourceRect.top + scrollY,
        sourceRect.width,
        sourceRect.height
      ),
      new DOMRect(
        targetRect.left + scrollX,
        targetRect.top + scrollY,
        targetRect.width,
        targetRect.height
      )
    ];
    
    for (const obstacle of obstacles) {
      rects.push(obstacle);
    }
    
    for (const rect of rects) {
      waypoints.push({ x: rect.left - spacing, y: rect.top - spacing, edge: 'corner' });
      waypoints.push({ x: rect.right + spacing, y: rect.top - spacing, edge: 'corner' });
      waypoints.push({ x: rect.left - spacing, y: rect.bottom + spacing, edge: 'corner' });
      waypoints.push({ x: rect.right + spacing, y: rect.bottom + spacing, edge: 'corner' });
      
      waypoints.push({ x: rect.left - spacing, y: rect.top + rect.height / 2, edge: 'left' });
      waypoints.push({ x: rect.right + spacing, y: rect.top + rect.height / 2, edge: 'right' });
      waypoints.push({ x: rect.left + rect.width / 2, y: rect.top - spacing, edge: 'top' });
      waypoints.push({ x: rect.left + rect.width / 2, y: rect.bottom + spacing, edge: 'bottom' });
    }
    
    return waypoints;
  }
  
  private findVisibilityGraphPaths(
    start: { x: number; y: number; edge: string },
    end: { x: number; y: number; edge: string },
    waypoints: { x: number; y: number; edge: string }[],
    obstacles: DOMRect[]
  ) {
    const allPoints = [start, ...waypoints, end];
    const graph: Map<number, number[]> = new Map();
    
    for (let i = 0; i < allPoints.length; i++) {
      graph.set(i, []);
      
      for (let j = 0; j < allPoints.length; j++) {
        if (i !== j && !this.pathIntersectsObstacle(allPoints[i], allPoints[j], obstacles)) {
          graph.get(i)?.push(j);
        }
      }
    }
    
    const maxSegments = 4;
    const paths = this.findPathsBFS(graph, 0, allPoints.length - 1, allPoints, maxSegments);
    
    return paths.map(indices => indices.map(i => allPoints[i]));
  }
  
  private findPathsBFS(
    graph: Map<number, number[]>,
    startIdx: number,
    endIdx: number,
    points: { x: number; y: number; edge: string }[],
    maxSegments: number
  ) {
    const queue: { path: number[], visited: Set<number> }[] = [
      { path: [startIdx], visited: new Set([startIdx]) }
    ];
    
    const completePaths: number[][] = [];
    
    while (queue.length > 0 && completePaths.length < 5) {
      const { path, visited } = queue.shift()!;
      const current = path[path.length - 1];
      
      if (current === endIdx) {
        completePaths.push(path);
        continue;
      }
      
      if (path.length >= maxSegments) {
        continue;
      }
      
      const neighbors = graph.get(current) || [];
      
      const sortedNeighbors = neighbors
        .filter(n => !visited.has(n))
        .sort((a, b) => {
          const distA = this.calculateDistance(points[a], points[endIdx]);
          const distB = this.calculateDistance(points[b], points[endIdx]);
          return distA - distB;
        });
      
      for (const neighbor of sortedNeighbors) {
        const newVisited = new Set(visited);
        newVisited.add(neighbor);
        
        queue.push({
          path: [...path, neighbor],
          visited: newVisited
        });
      }
    }
    
    return completePaths;
  }
  
  private generateCornerPaths(
    start: { x: number; y: number; edge: string },
    end: { x: number; y: number; edge: string },
    sourceRect: DOMRect,
    targetRect: DOMRect,
    offset: number
  ) {
    const paths = [];
    
    const sourceCorners = [
      { x: sourceRect.left - offset, y: sourceRect.top - offset, edge: 'corner' },
      { x: sourceRect.right + offset, y: sourceRect.top - offset, edge: 'corner' },
      { x: sourceRect.left - offset, y: sourceRect.bottom + offset, edge: 'corner' },
      { x: sourceRect.right + offset, y: sourceRect.bottom + offset, edge: 'corner' }
    ];
    
    const targetCorners = [
      { x: targetRect.left - offset, y: targetRect.top - offset, edge: 'corner' },
      { x: targetRect.right + offset, y: targetRect.top - offset, edge: 'corner' },
      { x: targetRect.left - offset, y: targetRect.bottom + offset, edge: 'corner' },
      { x: targetRect.right + offset, y: targetRect.bottom + offset, edge: 'corner' }
    ];
    
    for (const sourceCorner of sourceCorners) {
      if (!this.pathIntersectsObstacle(start, sourceCorner, [])) {
        for (const targetCorner of targetCorners) {
          if (!this.pathIntersectsObstacle(targetCorner, end, [])) {
            paths.push([start, sourceCorner, targetCorner, end]);
          }
        }
      }
    }
    
    return paths;
  }
}
