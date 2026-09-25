/**
 * Importers/Callers: tests/game/tycoon.test.ts (rotateItem, canPlaceFurniture), src/game/builder/TycoonBuilder.ts (FURNITURE_CATALOG)
 * Affected API: rotateItem(item: FurnitureItem) → FurnitureItem, canPlaceFurniture(grid, item, x, y) → boolean
 * Data Schemas: FurnitureItem { type: string, width: number, height: number, rotation: number }, Grid: boolean[][]
 * User Instruction: "continue!" — Task 7 step 3, implement Tycoon furniture catalog with rotation and placement validation
 */
export interface FurnitureItem {
  type: string;
  width: number;
  height: number;
  rotation: number;
}

export function rotateItem(item: FurnitureItem): FurnitureItem {
  return {
    ...item,
    width: item.height,
    height: item.width,
    rotation: (item.rotation + 90) % 360,
  };
}

export function canPlaceFurniture(
  grid: boolean[][],
  item: FurnitureItem,
  x: number,
  y: number,
): boolean {
  const w = item.rotation % 180 === 0 ? item.width : item.height;
  const h = item.rotation % 180 === 0 ? item.height : item.width;

  if (y + h > grid.length || x + w > grid[0]?.length) {
    return false;
  }

  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      if (!grid[y + dy]?.[x + dx]) {
        return false;
      }
    }
  }
  return true;
}

export const FURNITURE_CATALOG: FurnitureItem[] = [
  { type: 'desk', width: 2, height: 1, rotation: 0 },
  { type: 'chair', width: 1, height: 1, rotation: 0 },
  { type: 'plant', width: 1, height: 1, rotation: 0 },
  { type: 'whiteboard', width: 2, height: 1, rotation: 0 },
  { type: 'sofa', width: 3, height: 1, rotation: 0 },
];
