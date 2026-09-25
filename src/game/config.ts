/**
 * Importers/Callers: src/components/game/OfficeCanvas.tsx
 * Affected API: createGameConfig(parent), GRID_SIZE, OFFICE_WIDTH, OFFICE_HEIGHT
 * Data Schemas: Phaser.Types.Core.GameConfig
 * User Instruction: "vamos continuar"
 */
import Phaser from 'phaser';
import { GRID_SIZE, OFFICE_HEIGHT, OFFICE_WIDTH } from './constants';
import { OfficeScene } from './scenes/OfficeScene';

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: OFFICE_WIDTH * GRID_SIZE,
    height: OFFICE_HEIGHT * GRID_SIZE,
    backgroundColor: '#111827',
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [OfficeScene],
  };
}
