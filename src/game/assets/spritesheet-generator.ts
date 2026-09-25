/**
 * Importers/Callers: src/game/scenes/OfficeScene.ts
 * Affected API: generateOfficeTextures(scene)
 * Data Schemas: generated Phaser texture keys for floor, walls, furniture, and agents
 * User Instruction: "vamos continuar"
 */
import Phaser from 'phaser';

const texture = (
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (graphics: Phaser.GameObjects.Graphics) => void,
): void => {
  if (scene.textures.exists(key)) return;
  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(graphics);
  graphics.generateTexture(key, width, height);
  graphics.destroy();
};

const AGENT_ANIMATIONS = [
  'idle',
  'walking',
  'typing',
  'drinking_coffee',
  'meeting',
  'error',
] as const;

function drawAgent(
  graphics: Phaser.GameObjects.Graphics,
  state: typeof AGENT_ANIMATIONS[number],
  frame: number,
): void {
  const bob = state === 'walking' ? frame : 0;
  graphics.fillStyle(0xf5c2a0).fillRect(6, 1 + bob, 12, 10);
  graphics.fillStyle(0x1e293b).fillRect(5, bob, 14, 4);
  graphics.fillStyle(0xdc2626).fillRect(3, 11 + bob, 18, 12);
  graphics.fillStyle(0x172554);
  graphics.fillRect(frame === 0 ? 4 : 5, 23, 6, 7);
  graphics.fillRect(frame === 0 ? 14 : 13, 23, 6, 7);
  graphics.fillStyle(0xf8fafc).fillRect(8, 5 + bob, 2, 2);
  graphics.fillRect(14, 5 + bob, 2, 2);

  if (state === 'typing') {
    graphics.fillStyle(frame === 0 ? 0x38bdf8 : 0x7dd3fc).fillRect(1, 18, 22, 4);
  } else if (state === 'drinking_coffee') {
    graphics.fillStyle(0xf8fafc).fillRect(frame === 0 ? 20 : 18, 12, 4, 6);
    graphics.fillStyle(0x7c2d12).fillRect(frame === 0 ? 21 : 19, 13, 2, 3);
  } else if (state === 'meeting') {
    graphics.fillStyle(frame === 0 ? 0xa78bfa : 0xc4b5fd).fillRect(1, 10, 3, 8);
    graphics.fillRect(20, 10, 3, 8);
  } else if (state === 'error') {
    graphics.fillStyle(frame === 0 ? 0xef4444 : 0xfca5a5).fillRect(0, 0, 24, 2);
  }
}

export function generateOfficeTextures(scene: Phaser.Scene): void {
  texture(scene, 'office-floor', 32, 32, (g) => {
    g.fillStyle(0x25364a).fillRect(0, 0, 32, 32);
    g.lineStyle(1, 0x30445d).strokeRect(0, 0, 32, 32);
  });
  texture(scene, 'office-wall', 32, 32, (g) => {
    g.fillStyle(0x111827).fillRect(0, 0, 32, 32);
    g.fillStyle(0x334155).fillRect(2, 2, 28, 28);
  });
  texture(scene, 'office-desk', 64, 32, (g) => {
    g.fillStyle(0x713f12).fillRect(0, 8, 64, 20);
    g.fillStyle(0x92400e).fillRect(3, 4, 58, 8);
    g.fillStyle(0x0f172a).fillRect(24, 0, 18, 10);
    g.fillStyle(0x38bdf8).fillRect(27, 2, 12, 6);
  });
  texture(scene, 'office-coffee', 32, 32, (g) => {
    g.fillStyle(0x475569).fillRect(5, 4, 22, 26);
    g.fillStyle(0xf8fafc).fillRect(9, 8, 14, 9);
    g.fillStyle(0x7c2d12).fillRect(11, 20, 10, 7);
  });
  for (const state of AGENT_ANIMATIONS) {
    const frameKeys = [0, 1].map((frame) => {
      const key = `office-agent-${state}-${frame}`;
      texture(scene, key, 24, 30, (graphics) => drawAgent(graphics, state, frame));
      return { key };
    });
    const animationKey = `office-agent-${state}`;
    if (!scene.anims.exists(animationKey)) {
      scene.anims.create({
        key: animationKey,
        frames: frameKeys,
        frameRate: state === 'walking' ? 8 : 4,
        repeat: -1,
      });
    }
  }
}
