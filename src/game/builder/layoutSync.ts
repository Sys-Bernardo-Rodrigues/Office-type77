/**
 * Importers/Callers: src/app/page.tsx (TycoonCatalogModal onSave/onLoad handlers), tests/game/layout-sync.test.ts
 * Affected API: placementsToFurniture(placements), applyFurnitureToScene(scene, furniture)
 * Data Schemas: FurniturePayload matches GET/POST /api/office/layout's furniture shape
 * User Instruction: Task 8 final-review fix pass — code review found page.tsx's handleLoad (a)
 *   merged loaded furniture onto whatever was already placed instead of replacing it, silently
 *   dropping pieces that collided, and (b) left the store's selected-item/rotation state out of
 *   step with the scene after loading. Scene-agnostic (BuilderSceneLike is a subset of
 *   OfficeScene's already-public API) so this is unit testable without a real Phaser instance.
 */

export interface FurniturePayload {
  furnitureId: string;
  itemType: string;
  gridX: number;
  gridY: number;
  width?: number;
  height?: number;
  rotation?: number;
}

export interface PlacementLike {
  id: string;
  x: number;
  y: number;
  furniture: { type: string; width: number; height: number; rotation: number };
}

export interface BuilderSceneLike {
  getBuilderState(): { selectedItem: { rotation: number } | null; placements: PlacementLike[] };
  setBuilderMode(mode: 'view' | 'build'): void;
  selectBuilderItem(type: string): void;
  rotateBuilderSelection(): void;
  placeBuilderItem(x: number, y: number): string | null;
  removeBuilderItem(id: string): boolean;
}

export function placementsToFurniture(placements: PlacementLike[]): FurniturePayload[] {
  return placements.map((placement) => ({
    furnitureId: placement.id,
    itemType: placement.furniture.type,
    gridX: placement.x,
    gridY: placement.y,
    width: placement.furniture.width,
    height: placement.furniture.height,
    rotation: placement.furniture.rotation,
  }));
}

export interface ApplyFurnitureResult {
  placed: number;
  skipped: number;
}

export function applyFurnitureToScene(scene: BuilderSceneLike, furniture: FurniturePayload[]): ApplyFurnitureResult {
  scene.setBuilderMode('build');

  for (const existing of scene.getBuilderState().placements) {
    scene.removeBuilderItem(existing.id);
  }

  let placed = 0;
  let skipped = 0;

  for (const item of furniture) {
    scene.selectBuilderItem(item.itemType);
    const targetRotation = ((item.rotation ?? 0) % 360 + 360) % 360;
    for (
      let guard = 0;
      guard < 4 && (scene.getBuilderState().selectedItem?.rotation ?? 0) !== targetRotation;
      guard += 1
    ) {
      scene.rotateBuilderSelection();
    }
    const id = scene.placeBuilderItem(item.gridX, item.gridY);
    if (id) placed += 1;
    else skipped += 1;
  }

  return { placed, skipped };
}
