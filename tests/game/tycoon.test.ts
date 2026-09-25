/**
 * Importers/Callers: Vitest task runner
 * Affected API: canPlaceFurniture(), rotateItem() exported from src/game/builder/furnitureCatalog.ts
 * Data Schemas: FurnitureItem type with { type, width, height, rotation } shape
 * User Instruction: "continue!" — resuming Task 7 Tycoon Builder from plan step 1 (failing test)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { canPlaceFurniture, rotateItem } from '../../src/game/builder/furnitureCatalog';
import { TycoonBuilder } from '../../src/game/builder/TycoonBuilder';
import { AStarGrid } from '../../src/game/grid/AStarPathfinder';

describe('Office Tycoon Builder', () => {
  describe('rotateItem', () => {
    it('validates bounds and handles rotation properly', () => {
      const item = { type: 'desk', width: 2, height: 1, rotation: 0 };
      const rotated = rotateItem(item);
      expect(rotated.width).toBe(1);
      expect(rotated.height).toBe(2);
      expect(rotated.rotation).toBe(90);
    });

    it('rotates 180 degrees correctly', () => {
      const item = { type: 'desk', width: 2, height: 1, rotation: 90 };
      const rotated = rotateItem(item);
      expect(rotated.width).toBe(1);
      expect(rotated.height).toBe(2);
      expect(rotated.rotation).toBe(180);
    });
  });

  describe('canPlaceFurniture', () => {
    it('returns true when space is available', () => {
      const grid = [
        [true, true, true],
        [true, true, true],
        [true, true, true],
      ];
      const item = { type: 'chair', width: 1, height: 1, rotation: 0 };
      expect(canPlaceFurniture(grid, item, 0, 0)).toBe(true);
    });

    it('returns false when out of bounds', () => {
      const grid = [
        [true, true],
        [true, true],
      ];
      const item = { type: 'desk', width: 2, height: 1, rotation: 0 };
      expect(canPlaceFurniture(grid, item, 1, 0)).toBe(false);
    });

    it('returns false when space is occupied', () => {
      const grid = [
        [false, true],
        [true, true],
      ];
      const item = { type: 'chair', width: 1, height: 1, rotation: 0 };
      expect(canPlaceFurniture(grid, item, 0, 0)).toBe(false);
    });
  });

  describe('TycoonBuilder', () => {
    let grid: AStarGrid;
    let builder: TycoonBuilder;

    beforeEach(() => {
      grid = new AStarGrid(10, 10);
      builder = new TycoonBuilder(grid);
    });

    it('starts in view mode', () => {
      expect(builder.getMode()).toBe('view');
    });

    it('switches between modes', () => {
      builder.setMode('build');
      expect(builder.getMode()).toBe('build');
      builder.setMode('view');
      expect(builder.getMode()).toBe('view');
    });

    it('selects furniture item in build mode', () => {
      builder.setMode('build');
      builder.selectItem('desk');
      const selected = builder.getSelectedItem();
      expect(selected).not.toBeNull();
      expect(selected?.type).toBe('desk');
    });

    it('ignores selection in view mode', () => {
      builder.selectItem('desk');
      expect(builder.getSelectedItem()).toBeNull();
    });

    it('rotates selected item', () => {
      builder.setMode('build');
      builder.selectItem('desk');
      builder.rotateSelection();
      const selected = builder.getSelectedItem();
      expect(selected?.rotation).toBe(90);
      expect(selected?.width).toBe(1);
      expect(selected?.height).toBe(2);
    });

    it('places furniture successfully', () => {
      builder.setMode('build');
      builder.selectItem('chair');
      const id = builder.placeItem(0, 0);
      expect(id).not.toBeNull();
      const placements = builder.getPlacements();
      expect(placements).toHaveLength(1);
      expect(placements[0].x).toBe(0);
      expect(placements[0].y).toBe(0);
    });

    it('fails to place when occupied', () => {
      builder.setMode('build');
      builder.selectItem('chair');
      builder.placeItem(0, 0);
      builder.selectItem('chair');
      const result = builder.placeItem(0, 0);
      expect(result).toBeNull();
    });

    it('removes placed furniture', () => {
      builder.setMode('build');
      builder.selectItem('chair');
      const id = builder.placeItem(0, 0);
      expect(id).not.toBeNull();
      const removed = builder.removeItem(id!);
      expect(removed).toBe(true);
      expect(builder.getPlacements()).toHaveLength(0);
    });

    it('saves and loads layouts', () => {
      builder.setMode('build');
      builder.selectItem('chair');
      builder.placeItem(0, 0);
      builder.saveLayout('test-layout');

      builder.setMode('build');
      builder.selectItem('desk');
      builder.placeItem(2, 2);
      expect(builder.getPlacements()).toHaveLength(2);

      builder.loadLayout('test-layout');
      expect(builder.getPlacements()).toHaveLength(1);
      expect(builder.getPlacements()[0].furniture.type).toBe('chair');
    });
  });
});
