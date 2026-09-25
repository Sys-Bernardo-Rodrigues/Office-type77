/**
 * Importers/Callers: src/game/scenes/OfficeScene.ts (builder mode integration point)
 * Affected API: TycoonBuilder class - setMode(mode), selectItem(type), rotateSelection(), placeItem(x, y), removeItem(id), getPlacements(), saveLayout(name), loadLayout(id)
 * Data Schemas: BuilderMode = 'view' | 'build', Placement = { furniture: FurnitureItem, x: number, y: number, id: string }
 * User Instruction: implement (Task 7 step 3)
 */

import type { FurnitureItem } from './furnitureCatalog';
import { rotateItem, canPlaceFurniture, FURNITURE_CATALOG } from './furnitureCatalog';
import { AStarGrid } from '../grid/AStarPathfinder';

export type BuilderMode = 'view' | 'build';

export interface Placement {
  furniture: FurnitureItem;
  x: number;
  y: number;
  id: string;
}

type LayoutSnapshot = {
  name: string;
  placements: Placement[];
};

export class TycoonBuilder {
  private readonly grid: AStarGrid;
  private mode: BuilderMode = 'view';
  private selectedItem: FurnitureItem | null = null;
  private readonly placementsById: Map<string, Placement> = new Map();

  private readonly layoutsByName: Map<string, LayoutSnapshot> = new Map();

  // Snapshotted lazily, on first use, rather than in the constructor: TycoonBuilder is
  // constructed as an OfficeScene field initializer, which runs before OfficeScene.create()
  // ever marks walls/desks unwalkable on the shared AStarGrid. By the time any builder method
  // actually gets called (only reachable through builder:* event listeners registered at the
  // end of create()), the grid's static walkability is already settled.
  private staticWalkability: boolean[][] | null = null;

  constructor(grid: AStarGrid) {
    this.grid = grid;
  }

  setMode(mode: BuilderMode): void {
    this.mode = mode;
    if (mode === 'view') {
      this.selectedItem = null;
    }
  }

  getMode(): BuilderMode {
    return this.mode;
  }

  selectItem(type: string): void {
    if (this.mode !== 'build') return;
    const template = FURNITURE_CATALOG.find(f => f.type === type);
    if (!template) {
      this.selectedItem = null;
      return;
    }
    this.selectedItem = { ...template };
  }

  getSelectedItem(): FurnitureItem | null {
    return this.selectedItem;
  }

  rotateSelection(): void {
    if (this.mode !== 'build' || !this.selectedItem) return;
    this.selectedItem = rotateItem(this.selectedItem);
  }

  getPlacements(): Placement[] {
    return Array.from(this.placementsById.values());
  }

  private getGridState(): boolean[][] {
    if (!this.staticWalkability) {
      this.staticWalkability = this.grid.getGrid();
    }
    const occupied = this.staticWalkability.map(row => row.slice());

    for (const placement of this.placementsById.values()) {
      const w =
        placement.furniture.rotation % 180 === 0
          ? placement.furniture.width
          : placement.furniture.height;
      const h =
        placement.furniture.rotation % 180 === 0
          ? placement.furniture.height
          : placement.furniture.width;

      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          occupied[placement.y + dy] = occupied[placement.y + dy] || [];
          occupied[placement.y + dy][placement.x + dx] = false;
        }
      }
    }

    return occupied;
  }

  private recomputeWalkability(): void {
    this.grid.updateWalkability(this.getGridState());
  }

  canPlaceAt(x: number, y: number): boolean {
    if (!this.selectedItem || this.mode !== 'build') return false;
    const gridState = this.getGridState();
    return canPlaceFurniture(gridState, this.selectedItem, x, y);
  }

  placeItem(x: number, y: number, id?: string): string | null {
    if (!this.selectedItem || this.mode !== 'build') return null;
    const gridState = this.getGridState();
    if (!canPlaceFurniture(gridState, this.selectedItem, x, y)) return null;

    const placementId = id ?? this.generateId();

    const placement: Placement = {
      id: placementId,
      furniture: { ...this.selectedItem },
      x,
      y,
    };

    this.placementsById.set(placementId, placement);
    this.recomputeWalkability();
    return placementId;
  }

  removeItem(id: string): boolean {
    const existed = this.placementsById.delete(id);
    if (existed) {
      this.recomputeWalkability();
    }
    return existed;
  }

  saveLayout(name: string): void {
    this.layoutsByName.set(name, {
      name,
      placements: this.getPlacements(),
    });
  }

  loadLayout(name: string): boolean {
    const layout = this.layoutsByName.get(name);
    if (!layout) return false;

    this.placementsById.clear();
    for (const placement of layout.placements) {
      this.placementsById.set(placement.id, {
        ...placement,
        furniture: { ...placement.furniture },
      });
    }

    this.recomputeWalkability();
    return true;
  }

  private generateId(): string {
    return `p_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  }
}
