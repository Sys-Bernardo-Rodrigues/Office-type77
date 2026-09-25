/**
 * A* Grid Pathfinding for Office Navigation
 *
 * Importers/Callers: tests/game/pathfinding.test.ts, OfficeScene.ts, AgentSprite.ts
 * Affected API: AStarGrid class with findPath(x,y), setWalkable(x,y,bool), isWalkable(x,y), constructor(width,height)
 * Data Schemas: GridPosition {x: number, y: number}, path: GridPosition[], node: GridNode with gCost/hCost/fCost/parent/walkable
 * User Instruction: "continue" - implementing Task 6: Phaser 3 Office Engine with A* pathfinding
 */

export interface GridPosition {
  x: number;
  y: number;
}

interface GridNode {
  position: GridPosition;
  gCost: number;
  hCost: number;
  fCost: number;
  parent: GridNode | null;
  walkable: boolean;
}

export class AStarGrid {
  private width: number;
  private height: number;
  private nodes: GridNode[][];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.nodes = this.createGrid();
  }

  private createGrid(): GridNode[][] {
    const grid: GridNode[][] = [];
    for (let y = 0; y < this.height; y++) {
      const row: GridNode[] = [];
      for (let x = 0; x < this.width; x++) {
        row.push({
          position: { x, y },
          gCost: 0,
          hCost: 0,
          fCost: 0,
          parent: null,
          walkable: true,
        });
      }
      grid.push(row);
    }
    return grid;
  }

  setWalkable(x: number, y: number, walkable: boolean): void {
    if (this.isInBounds(x, y)) {
      this.nodes[y][x].walkable = walkable;
    }
  }

  isWalkable(x: number, y: number): boolean {
    return this.isInBounds(x, y) && this.nodes[y][x].walkable;
  }

  private isInBounds(x: number, y: number): boolean {
    return Number.isInteger(x) && Number.isInteger(y)
      && x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  findPath(start: GridPosition, end: GridPosition): GridPosition[] {
    if (!this.isInBounds(start.x, start.y) || !this.isInBounds(end.x, end.y)) {
      return [];
    }

    if (start.x === end.x && start.y === end.y) {
      return [];
    }

    if (!this.isWalkable(end.x, end.y)) {
      return [];
    }

    // Reset node costs without clearing obstacles
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.nodes[y][x].gCost = Infinity;
        this.nodes[y][x].hCost = 0;
        this.nodes[y][x].fCost = Infinity;
        this.nodes[y][x].parent = null;
      }
    }

    const openSet: GridNode[] = [];
    const closedSet: Set<string> = new Set();

    const startNode = this.nodes[start.y][start.x];
    const endNode = this.nodes[end.y][end.x];

    if (!startNode.walkable || !endNode.walkable) {
      return [];
    }

    startNode.gCost = 0;
    startNode.hCost = this.heuristic(start, end);
    startNode.fCost = startNode.hCost;
    openSet.push(startNode);

    while (openSet.length > 0) {
      const current = openSet.reduce((a, b) => (a.fCost <= b.fCost ? a : b));
      const currentIndex = openSet.indexOf(current);
      openSet.splice(currentIndex, 1);

      closedSet.add(`${current.position.x},${current.position.y}`);

      if (current.position.x === end.x && current.position.y === end.y) {
        return this.reconstructPath(current);
      }

      const neighbors = this.getNeighbors(current);
      for (const neighbor of neighbors) {
        if (closedSet.has(`${neighbor.position.x},${neighbor.position.y}`) || !neighbor.walkable) {
          continue;
        }

        const tentativeGCost = current.gCost + 1;

        if (tentativeGCost < neighbor.gCost) {
          neighbor.parent = current;
          neighbor.gCost = tentativeGCost;
          neighbor.hCost = this.heuristic(neighbor.position, end);
          neighbor.fCost = neighbor.gCost + neighbor.hCost;

          if (!openSet.includes(neighbor)) {
            openSet.push(neighbor);
          }
        }
      }
    }

    return [];
  }

  private getNeighbors(node: GridNode): GridNode[] {
    const neighbors: GridNode[] = [];
    const { x, y } = node.position;

    const directions = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
    ];

    for (const { dx, dy } of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isInBounds(nx, ny)) {
        neighbors.push(this.nodes[ny][nx]);
      }
    }

    return neighbors;
  }

  private heuristic(a: GridPosition, b: GridPosition): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  private reconstructPath(endNode: GridNode): GridPosition[] {
    const path: GridPosition[] = [];
    let current: GridNode | null = endNode;

    while (current !== null) {
      path.unshift({ x: current.position.x, y: current.position.y });
      current = current.parent;
    }

    return path;
  }

  getGrid(): boolean[][] {
    return this.nodes.map(row => row.map(node => node.walkable));
  }

  updateWalkability(gridState: boolean[][]): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (gridState[y] && gridState[y][x] !== undefined) {
          this.nodes[y][x].walkable = gridState[y][x];
        }
      }
    }
  }
}
