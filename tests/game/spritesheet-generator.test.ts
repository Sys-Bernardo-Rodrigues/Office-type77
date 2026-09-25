/**
 * Importers/Callers: Vitest
 * Affected API: generateOfficeTextures(scene)
 * Data Schemas: Phaser texture and animation keys for AgentAnimationState
 * User Instruction: "vamos continuar"
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({ default: {} }));

import { generateOfficeTextures } from '../../src/game/assets/spritesheet-generator';

function createScene() {
  const graphics = {
    fillStyle: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    lineStyle: vi.fn().mockReturnThis(),
    strokeRect: vi.fn().mockReturnThis(),
    generateTexture: vi.fn(),
    destroy: vi.fn(),
  };
  const existingTextures = new Set<string>();
  const existingAnimations = new Set<string>();

  return {
    textures: { exists: vi.fn((key: string) => existingTextures.has(key)) },
    make: { graphics: vi.fn(() => graphics) },
    anims: {
      exists: vi.fn((key: string) => existingAnimations.has(key)),
      create: vi.fn(({ key }: { key: string }) => existingAnimations.add(key)),
    },
    graphics,
  };
}

describe('generateOfficeTextures', () => {
  it('registers an animation for every agent state', () => {
    const scene = createScene();

    generateOfficeTextures(scene as never);

    expect(scene.anims.create.mock.calls.map(([config]) => config.key)).toEqual([
      'office-agent-idle',
      'office-agent-walking',
      'office-agent-typing',
      'office-agent-drinking_coffee',
      'office-agent-meeting',
      'office-agent-error',
    ]);
  });

  it('does not register duplicate animations', () => {
    const scene = createScene();

    generateOfficeTextures(scene as never);
    generateOfficeTextures(scene as never);

    expect(scene.anims.create).toHaveBeenCalledTimes(6);
  });
});
