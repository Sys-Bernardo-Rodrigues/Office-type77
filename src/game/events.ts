/**
 * Importers/Callers: src/game/scenes/OfficeScene.ts, src/app/page.tsx (HUD -> Phaser event bridge)
 * Affected API: OFFICE_EVENT, BUILDER_EVENT string constant maps
 * Data Schemas: Phaser.Game event names shared between the scene and the React HUD
 * User Instruction: Task 8 ruling — extracted from OfficeScene.ts so the HUD can import event
 *   names without pulling the Phaser module (and its window/document references) into the
 *   server-rendered page.tsx module graph.
 */
export const OFFICE_EVENT = {
  addAgent: 'office:add-agent',
  moveAgent: 'office:move-agent',
  stateChange: 'agent:state_change',
  thought: 'agent:thought',
  speech: 'agent:speech',
} as const;

export const BUILDER_EVENT = {
  setMode: 'builder:set-mode',
  selectItem: 'builder:select-item',
  rotate: 'builder:rotate',
  place: 'builder:place',
  remove: 'builder:remove',
  save: 'builder:save',
  load: 'builder:load',
} as const;
