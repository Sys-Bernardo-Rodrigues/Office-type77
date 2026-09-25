/**
 * Importers/Callers: tests/game/pathfinding.test.ts, Phaser OfficeScene, AgentSprite
 * Affected API: AStarGrid class with findPath(), setWalkable(), constructor
 * Data Schemas: Grid coordinate {x, y}, path array of coordinates
 * User Instruction: "continue" (Task 6: Phaser 3 Office Engine implementation)
 */
import { describe, it, expect } from 'vitest';
import { AStarGrid } from '../../src/game/grid/AStarPathfinder';

describe('A* Grid Pathfinding', () => {
  it('calculates optimal path avoiding obstacles', () => {
    const grid = new AStarGrid(10, 10);
    grid.setWalkable(2, 2, false); // Obstacle
    const path = grid.findPath({ x: 0, y: 2 }, { x: 4, y: 2 });
    expect(path.length).toBeGreaterThan(0);
    expect(path.some(p => p.x === 2 && p.y === 2)).toBe(false);
  });

  it('returns empty path when start equals end', () => {
    const grid = new AStarGrid(5, 5);
    const path = grid.findPath({ x: 2, y: 2 }, { x: 2, y: 2 });
    expect(path.length).toBe(0);
  });

  it('returns empty path when either endpoint is outside the grid', () => {
    const grid = new AStarGrid(5, 5);

    expect(grid.findPath({ x: -1, y: 2 }, { x: 4, y: 2 })).toEqual([]);
    expect(grid.findPath({ x: 0, y: 2 }, { x: 5, y: 2 })).toEqual([]);
  });

  it('returns empty path for fractional or non-finite endpoints', () => {
    const grid = new AStarGrid(5, 5);

    expect(grid.findPath({ x: 0.5, y: 2 }, { x: 4, y: 2 })).toEqual([]);
    expect(grid.findPath({ x: 0, y: 2 }, { x: Number.NaN, y: 2 })).toEqual([]);
    expect(grid.findPath({ x: 0, y: Number.POSITIVE_INFINITY }, { x: 4, y: 2 })).toEqual([]);
  });

  it('returns empty path when either endpoint is blocked', () => {
    const grid = new AStarGrid(5, 5);
    grid.setWalkable(0, 2, false);
    grid.setWalkable(4, 2, false);

    expect(grid.findPath({ x: 0, y: 2 }, { x: 3, y: 2 })).toEqual([]);
    expect(grid.findPath({ x: 1, y: 2 }, { x: 4, y: 2 })).toEqual([]);
  });

  it('returns empty path when no path exists due to blocking obstacles', () => {
    const grid = new AStarGrid(5, 5);
    // Create a wall blocking the path
    grid.setWalkable(2, 0, false);
    grid.setWalkable(2, 1, false);
    grid.setWalkable(2, 2, false);
    grid.setWalkable(2, 3, false);
    grid.setWalkable(2, 4, false);
    const path = grid.findPath({ x: 0, y: 2 }, { x: 4, y: 2 });
    expect(path.length).toBe(0);
  });
});