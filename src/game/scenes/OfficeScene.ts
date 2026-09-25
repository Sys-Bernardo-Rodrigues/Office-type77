/**
 * Importers/Callers: src/game/config.ts, Phaser scene manager, src/components/game/OfficeCanvas.tsx event bridge,
 *   src/components/game/TycoonCatalogModal.tsx (builder:* events)
 * Affected API: OfficeScene, addAgent(), moveAgent(), updateAgentState(), showAgentBubble(),
 *   setBuilderMode(), selectBuilderItem(), rotateBuilderSelection(), placeBuilderItem(), removeBuilderItem(),
 *   getBuilderState(), saveBuilderLayout(), loadBuilderLayout()
 * Data Schemas: OfficeAgentEvent payloads with agentId, state/text, and grid coordinates;
 *   builder:* payloads carrying furniture type, grid coordinates, and layout name
 * User Instruction: "vamos continuar o projeto paramos na task 7 da uma analisada e vamos continuar"
 */
import Phaser from 'phaser';
import { generateOfficeTextures } from '../assets/spritesheet-generator';
import { GRID_SIZE, OFFICE_HEIGHT, OFFICE_WIDTH } from '../constants';
import { AgentSprite, type AgentAnimationState } from '../entities/AgentSprite';
import type { BubbleKind } from '../entities/ThoughtBubble';
import { AStarGrid } from '../grid/AStarPathfinder';
import { TycoonBuilder, type BuilderMode, type Placement } from '../builder/TycoonBuilder';
import { OFFICE_EVENT, BUILDER_EVENT } from '../events';

export { OFFICE_EVENT, BUILDER_EVENT };

const FURNITURE_TEXTURE: Record<string, string> = {
  desk: 'office-desk',
  chair: 'office-chair',
  plant: 'office-plant',
  whiteboard: 'office-whiteboard',
  sofa: 'office-sofa',
};

const AGENT_STATES: ReadonlySet<AgentAnimationState> = new Set([
  'idle',
  'walking',
  'typing',
  'drinking_coffee',
  'meeting',
  'error',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAgentId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isCoordinate(value: unknown): value is number {
  return Number.isInteger(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isInteriorCell(x: number, y: number): boolean {
  return x > 0 && x < OFFICE_WIDTH - 1 && y > 0 && y < OFFICE_HEIGHT - 1;
}

export class OfficeScene extends Phaser.Scene {
  private readonly navigation = new AStarGrid(OFFICE_WIDTH, OFFICE_HEIGHT);
  private readonly agents = new Map<string, AgentSprite>();
  private readonly builder = new TycoonBuilder(this.navigation);
  private readonly builderSprites = new Map<string, Phaser.GameObjects.Image>();

  constructor() {
    super('OfficeScene');
  }

  create(): void {
    generateOfficeTextures(this);
    this.drawOffice();
    this.addAgent('demo-agent', 3, 6);

    this.game.events.on(OFFICE_EVENT.addAgent, this.handleAddAgent, this);
    this.game.events.on(OFFICE_EVENT.moveAgent, this.handleMoveAgent, this);
    this.game.events.on(OFFICE_EVENT.stateChange, this.handleStateChange, this);
    this.game.events.on(OFFICE_EVENT.thought, this.handleThought, this);
    this.game.events.on(OFFICE_EVENT.speech, this.handleSpeech, this);
    this.game.events.on(BUILDER_EVENT.setMode, this.handleSetBuilderMode, this);
    this.game.events.on(BUILDER_EVENT.selectItem, this.handleSelectBuilderItem, this);
    this.game.events.on(BUILDER_EVENT.rotate, this.handleRotateBuilderSelection, this);
    this.game.events.on(BUILDER_EVENT.place, this.handlePlaceBuilderItem, this);
    this.game.events.on(BUILDER_EVENT.remove, this.handleRemoveBuilderItem, this);
    this.game.events.on(BUILDER_EVENT.save, this.handleSaveBuilderLayout, this);
    this.game.events.on(BUILDER_EVENT.load, this.handleLoadBuilderLayout, this);
    this.input?.on('pointerdown', this.handlePointerDown, this);
    this.input?.keyboard?.on('keydown-R', this.rotateBuilderSelection, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.removeEventListeners, this);
  }

  addAgent(agentId: string, gridX: number, gridY: number): AgentSprite {
    this.agents.get(agentId)?.destroy();
    const agent = new AgentSprite(this, agentId, gridX, gridY);
    this.agents.set(agentId, agent);
    return agent;
  }

  moveAgent(agentId: string, targetX: number, targetY: number): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    const start = {
      x: Math.floor(agent.x / GRID_SIZE),
      y: Math.floor(agent.y / GRID_SIZE),
    };
    agent.moveAlong(this.navigation.findPath(start, { x: targetX, y: targetY }));
  }

  updateAgentState(agentId: string, state: AgentAnimationState): void {
    this.agents.get(agentId)?.setAgentState(state);
  }

  showAgentBubble(agentId: string, text: string, kind: BubbleKind): void {
    this.agents.get(agentId)?.showBubble(text, kind);
  }

  setBuilderMode(mode: BuilderMode): void {
    this.builder.setMode(mode);
  }

  selectBuilderItem(type: string): void {
    this.builder.selectItem(type);
  }

  rotateBuilderSelection(): void {
    this.builder.rotateSelection();
  }

  placeBuilderItem(x: number, y: number): string | null {
    const id = this.builder.placeItem(x, y);
    if (!id) return null;
    const placement = this.builder.getPlacements().find((p) => p.id === id);
    if (placement) this.renderBuilderPlacement(placement);
    return id;
  }

  removeBuilderItem(id: string): boolean {
    const removed = this.builder.removeItem(id);
    if (removed) {
      this.builderSprites.get(id)?.destroy();
      this.builderSprites.delete(id);
    }
    return removed;
  }

  getBuilderState(): { mode: BuilderMode; selectedItem: ReturnType<TycoonBuilder['getSelectedItem']>; placements: Placement[] } {
    return {
      mode: this.builder.getMode(),
      selectedItem: this.builder.getSelectedItem(),
      placements: this.builder.getPlacements(),
    };
  }

  saveBuilderLayout(name: string): void {
    this.builder.saveLayout(name);
  }

  loadBuilderLayout(name: string): boolean {
    const loaded = this.builder.loadLayout(name);
    if (loaded) this.redrawBuilderPlacements();
    return loaded;
  }

  private drawOffice(): void {
    for (let y = 0; y < OFFICE_HEIGHT; y += 1) {
      for (let x = 0; x < OFFICE_WIDTH; x += 1) {
        this.add.image(x * GRID_SIZE, y * GRID_SIZE, 'office-floor').setOrigin(0);
        const border = x === 0 || y === 0 || x === OFFICE_WIDTH - 1 || y === OFFICE_HEIGHT - 1;
        if (border) {
          this.add.image(x * GRID_SIZE, y * GRID_SIZE, 'office-wall').setOrigin(0);
          this.navigation.setWalkable(x, y, false);
        }
      }
    }

    const desks = [[6, 4], [11, 4], [6, 9], [11, 9]];
    for (const [x, y] of desks) {
      this.add.image(x * GRID_SIZE, y * GRID_SIZE, 'office-desk').setOrigin(0).setDepth(y * GRID_SIZE);
      this.navigation.setWalkable(x, y, false);
      this.navigation.setWalkable(x + 1, y, false);
    }
    this.add.image(17 * GRID_SIZE, 2 * GRID_SIZE, 'office-coffee').setOrigin(0).setDepth(3 * GRID_SIZE);
    this.navigation.setWalkable(17, 2, false);
  }

  private renderBuilderPlacement(placement: Placement): void {
    const textureKey = FURNITURE_TEXTURE[placement.furniture.type] ?? 'office-desk';
    const footprintW = placement.furniture.rotation % 180 === 0
      ? placement.furniture.width
      : placement.furniture.height;
    const footprintH = placement.furniture.rotation % 180 === 0
      ? placement.furniture.height
      : placement.furniture.width;

    const sprite = this.add.image(placement.x * GRID_SIZE, placement.y * GRID_SIZE, textureKey)
      .setOrigin(0)
      .setDisplaySize(footprintW * GRID_SIZE, footprintH * GRID_SIZE)
      .setDepth(placement.y * GRID_SIZE);
    this.builderSprites.set(placement.id, sprite);
  }

  private redrawBuilderPlacements(): void {
    for (const sprite of this.builderSprites.values()) sprite.destroy();
    this.builderSprites.clear();
    for (const placement of this.builder.getPlacements()) this.renderBuilderPlacement(placement);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.builder.getMode() !== 'build') return;
    const gridX = Math.floor(pointer.worldX / GRID_SIZE);
    const gridY = Math.floor(pointer.worldY / GRID_SIZE);
    this.placeBuilderItem(gridX, gridY);
  }

  private handleSetBuilderMode(payload: unknown): void {
    if (!isRecord(payload) || (payload.mode !== 'view' && payload.mode !== 'build')) return;
    this.setBuilderMode(payload.mode);
  }

  private handleSelectBuilderItem(payload: unknown): void {
    if (!isRecord(payload) || !isNonEmptyString(payload.type)) return;
    this.selectBuilderItem(payload.type);
  }

  private handleRotateBuilderSelection(): void {
    this.rotateBuilderSelection();
  }

  private handlePlaceBuilderItem(payload: unknown): void {
    if (!isRecord(payload) || !isCoordinate(payload.x) || !isCoordinate(payload.y)) return;
    this.placeBuilderItem(payload.x, payload.y);
  }

  private handleRemoveBuilderItem(payload: unknown): void {
    if (!isRecord(payload) || !isNonEmptyString(payload.id)) return;
    this.removeBuilderItem(payload.id);
  }

  private handleSaveBuilderLayout(payload: unknown): void {
    if (!isRecord(payload) || !isNonEmptyString(payload.name)) return;
    this.saveBuilderLayout(payload.name);
  }

  private handleLoadBuilderLayout(payload: unknown): void {
    if (!isRecord(payload) || !isNonEmptyString(payload.name)) return;
    this.loadBuilderLayout(payload.name);
  }

  private handleAddAgent(payload: unknown): void {
    if (!isRecord(payload) || !isAgentId(payload.agentId)
      || !isCoordinate(payload.x) || !isCoordinate(payload.y)
      || !isInteriorCell(payload.x, payload.y)
      || !this.navigation.isWalkable(payload.x, payload.y)) return;
    this.addAgent(payload.agentId, payload.x, payload.y);
  }

  private handleMoveAgent(payload: unknown): void {
    if (!isRecord(payload) || !isAgentId(payload.agentId)
      || !isCoordinate(payload.targetX) || !isCoordinate(payload.targetY)
      || !isInteriorCell(payload.targetX, payload.targetY)
      || !this.navigation.isWalkable(payload.targetX, payload.targetY)) return;
    this.moveAgent(payload.agentId, payload.targetX, payload.targetY);
  }

  private handleStateChange(payload: unknown): void {
    if (!isRecord(payload) || !isAgentId(payload.agentId)
      || typeof payload.state !== 'string'
      || !AGENT_STATES.has(payload.state as AgentAnimationState)) return;
    this.updateAgentState(payload.agentId, payload.state as AgentAnimationState);
  }

  private handleThought(payload: unknown): void {
    if (!isRecord(payload) || !isAgentId(payload.agentId) || typeof payload.text !== 'string') return;
    this.showAgentBubble(payload.agentId, payload.text, 'thought');
  }

  private handleSpeech(payload: unknown): void {
    if (!isRecord(payload) || !isAgentId(payload.agentId) || typeof payload.text !== 'string') return;
    this.showAgentBubble(payload.agentId, payload.text, 'speech');
  }

  private removeEventListeners(): void {
    this.game.events.off(OFFICE_EVENT.addAgent, this.handleAddAgent, this);
    this.game.events.off(OFFICE_EVENT.moveAgent, this.handleMoveAgent, this);
    this.game.events.off(OFFICE_EVENT.stateChange, this.handleStateChange, this);
    this.game.events.off(OFFICE_EVENT.thought, this.handleThought, this);
    this.game.events.off(OFFICE_EVENT.speech, this.handleSpeech, this);
    this.game.events.off(BUILDER_EVENT.setMode, this.handleSetBuilderMode, this);
    this.game.events.off(BUILDER_EVENT.selectItem, this.handleSelectBuilderItem, this);
    this.game.events.off(BUILDER_EVENT.rotate, this.handleRotateBuilderSelection, this);
    this.game.events.off(BUILDER_EVENT.place, this.handlePlaceBuilderItem, this);
    this.game.events.off(BUILDER_EVENT.remove, this.handleRemoveBuilderItem, this);
    this.game.events.off(BUILDER_EVENT.save, this.handleSaveBuilderLayout, this);
    this.game.events.off(BUILDER_EVENT.load, this.handleLoadBuilderLayout, this);
    this.input?.off('pointerdown', this.handlePointerDown, this);
    this.input?.keyboard?.off('keydown-R', this.rotateBuilderSelection, this);
    for (const agent of this.agents.values()) agent.destroy();
    this.agents.clear();
    for (const sprite of this.builderSprites.values()) sprite.destroy();
    this.builderSprites.clear();
  }
}
