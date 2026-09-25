/**
 * Importers/Callers: Vitest suite; exercises the Tycoon layout save/load sync helpers used by
 *   src/app/page.tsx's TycoonCatalogModal onSave/onLoad handlers
 * Affected API: placementsToFurniture(placements), applyFurnitureToScene(scene, furniture)
 * Data Schemas: FurniturePayload matches GET/POST /api/office/layout's furniture shape
 * User Instruction: Task 8 final-review fix pass — code review found page.tsx's handleLoad (a)
 *   merged loaded furniture onto whatever was already placed instead of replacing it, silently
 *   dropping pieces that collided, and (b) left the store's selected-item/rotation state out of
 *   step with the scene after loading. Extracted into a scene-agnostic pure function (a fake
 *   "scene" object implementing the same four methods OfficeScene already exposes publicly) so
 *   the clear-then-place logic is unit testable without a real Phaser instance.
 */
import { describe, expect, it, vi } from 'vitest';
import { applyFurnitureToScene, placementsToFurniture, type BuilderSceneLike, type PlacementLike } from '../../src/game/builder/layoutSync';

function makeFakeScene(initialPlacements: PlacementLike[] = []): BuilderSceneLike & { placements: PlacementLike[] } {
  let placements = [...initialPlacements];
  let selectedType: string | null = null;
  let selectedRotation = 0;
  let counter = 0;

  return {
    get placements() {
      return placements;
    },
    setBuilderMode: vi.fn(),
    selectBuilderItem: (type: string) => {
      selectedType = type;
      selectedRotation = 0;
    },
    rotateBuilderSelection: () => {
      selectedRotation = (selectedRotation + 90) % 360;
    },
    getBuilderState: () => ({
      selectedItem: selectedType ? { rotation: selectedRotation } : null,
      placements,
    }),
    placeBuilderItem: (x: number, y: number) => {
      if (!selectedType) return null;
      // Simulate collision: refuse to place at (5, 5) no matter what, like a desk sitting there.
      if (x === 5 && y === 5) return null;
      const id = `fake-${counter++}`;
      placements = [...placements, { id, x, y, furniture: { type: selectedType, width: 1, height: 1, rotation: selectedRotation } }];
      return id;
    },
    removeBuilderItem: (id: string) => {
      const before = placements.length;
      placements = placements.filter((p) => p.id !== id);
      return placements.length < before;
    },
  };
}

describe('placementsToFurniture', () => {
  it('maps scene placements to the office/layout API furniture shape', () => {
    const furniture = placementsToFurniture([
      { id: 'p1', x: 3, y: 4, furniture: { type: 'chair', width: 1, height: 1, rotation: 90 } },
    ]);

    expect(furniture).toEqual([
      { furnitureId: 'p1', itemType: 'chair', gridX: 3, gridY: 4, width: 1, height: 1, rotation: 90 },
    ]);
  });
});

describe('applyFurnitureToScene', () => {
  it('removes existing placements before applying the loaded furniture (replace, not merge)', () => {
    const scene = makeFakeScene([{ id: 'old', x: 1, y: 1, furniture: { type: 'desk', width: 2, height: 1, rotation: 0 } }]);

    applyFurnitureToScene(scene, [{ furnitureId: 'new', itemType: 'chair', gridX: 2, gridY: 2 }]);

    expect(scene.placements.some((p) => p.id === 'old')).toBe(false);
    expect(scene.placements.some((p) => p.x === 2 && p.y === 2)).toBe(true);
  });

  it('reports pieces skipped due to collisions instead of dropping them silently', () => {
    const scene = makeFakeScene();

    const result = applyFurnitureToScene(scene, [
      { furnitureId: 'a', itemType: 'chair', gridX: 5, gridY: 5 },
      { furnitureId: 'b', itemType: 'chair', gridX: 6, gridY: 6 },
    ]);

    expect(result).toEqual({ placed: 1, skipped: 1 });
  });

  it('rotates each item to its saved rotation before placing it', () => {
    const scene = makeFakeScene();

    applyFurnitureToScene(scene, [{ furnitureId: 'a', itemType: 'chair', gridX: 1, gridY: 1, rotation: 180 }]);

    expect(scene.placements[0].furniture.rotation).toBe(180);
  });
});
